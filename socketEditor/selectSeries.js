import PromisePool from "es6-promise-pool";
import compressjs from "compressjs";
import { partition } from "ramda";

// TODO Should we just cache this in the DB? WG
const compressData = data => {
  const algorithm = compressjs.BWTC;

  const { length } = data;
  const unit_8_array = new Uint8Array(length * 2);

  for (let i = 0, j = 0; i < length; i++, j = j + 2) {
    unit_8_array[j + 1] = data[i] & 255;
    unit_8_array[j] = data[i] >> 8;
  }

  const compressedData = algorithm.compressFile(unit_8_array);
  return compressedData;
};

export default async ({
  socket,
  action: { seriesUID, sliceLocation = 0, loadImages = true } = {},
  adapter
}) => {
  const {
    dicom: { getImages = () => {}, getImageData = () => {} } = {}
  } = adapter;

  const imageList = await getImages({
    seriesUID
  });

  // Send selected image first
  const { [sliceLocation]: { instanceUID } = {} } = imageList;

  await new Promise(async (resolve, reject) => {
    socket.emit(
      "action",
      {
        type: "VOLUME_SET",
        seriesUID,
        volume: await Promise.all(
          imageList.map(async (v, i) => {
            // pre-cache selected image
            return sliceLocation === i
              ? {
                  ...v,
                  pixelData: compressData(await getImageData({ instanceUID }))
                }
              : v;
          })
        )
      },
      () => resolve()
    );
  });

  if (!loadImages) {
    // Bailout
    socket.emit("action", { type: "SPINNER_TOGGLE", toggle: false });
    socket.emit("action", { type: "VOLUME_LOADED" });
    return;
  }

  socket.emit("action", {
    type: "SPINNER_TOGGLE",
    toggle: false
  });

  const concurrency = 4;

  // Sort background loading from selected image.
  const [low = [], high = []] = partition(({ index }) => index < sliceLocation)(
    imageList
      .map((v, i) => ({
        ...v,
        index: i // Save orginal index
      }))
      .filter(({ index }) => index !== sliceLocation) // Don't reload pre-cached image
  );

  const { list: imageListEnhanced = [] } = imageList.reduce(
    ({ list = [], low: [l, ...low] = [], high: [h, ...high] = [] }) => {
      return {
        list: [...list, ...(l ? [l] : []), ...(h ? [h] : [])],
        low,
        high
      };
    },
    {
      list: [],
      low: low.sort(({ index: a }, { index: b }) => b - a),
      high
    }
  );
  // TODO Testing compression of entire series.
  const test = await Promise.all(
    imageListEnhanced.map(async ({ instanceUID }) => {
      return await getImageData({ instanceUID });
    })
  );

  // TODO Sort images from sliceLocation outward
  const pool = new PromisePool(() => {
    if (imageListEnhanced.length <= 0) {
      return null;
    }

    const { instanceUID, index } = imageListEnhanced.shift();

    return new Promise(async (resolve, reject) => {
      // TODO Images will already be precompression compressed? WG
      const data = await getImageData({ instanceUID, compressed: true });

      // TODO Benchmark client speed?
      const compressStart = new Date();

      // TODO Save as precompressed? WG
      const dataCompressed = compressData(data);
      const compressEnd = new Date();

      //   console.log(
      //     `Blob Saved ${blobName} Duration ${(new Date() -
      //       metricStartBlob) /
      //       1000} sec`
      //   );

      console.log(
        "Compression size",
        data.length * 2,
        dataCompressed.length,
        (compressEnd - compressStart) / 1000
      );

      socket.emit(
        "action",
        {
          type: "VOLUME_SLICE_DATA",
          index,
          data: dataCompressed
        },
        ({ selectedSeries }) => {
          if (selectedSeries !== seriesUID) {
            reject({ message: "Series switched during load killing loading." });
          }

          resolve();
        }
      );
    });
  }, concurrency);

  const poolPromise = pool.start();

  // Wait for the pool to settle.
  poolPromise.then(
    () => {
      console.log("All images loaded");
      socket.emit("action", { type: "VOLUME_LOADED", seriesUID });
    },
    ({ message }) => {
      console.log(`Error ${message}`);
    }
  );
};
