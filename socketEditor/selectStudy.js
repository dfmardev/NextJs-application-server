import { Vector3 } from "three";
import selectSeries from "./selectSeries";
let debug = require('debug')('debug');

export default async ({ socket, action, adapter }) => {
    const {
        projects: { getProjectPayload = () => { }, getProject = () => { } } = {},
        dicom: {
            getSeries = () => { },
            getStudy = () => { },
            getImages = () => { }
        } = {}
    } = adapter;
    const { studyUID, loadImages } = action;

    debug("studyUID", studyUID); // TODO Used for debugging / logging

    if (!studyUID) {
        return; // TODO Handle bailout better? Error handle?
    }

    const [
        { seriesFilter = {} } = {},
        project,
        { studyType } = {}
    ] = await Promise.all([
        getProject({ studyUID }),
        getProjectPayload({ studyUID }),
        getStudy({ studyUID })
    ]);

    if (project === undefined) {
        debug("Socket API Project not found");
        return; // TODO Handle bailout better? Error handle?
    }

    const dicomSeries = await Promise.all(
        (await getSeries({ studyUID }))
            .filter(
                ({ seriesName }) => seriesName !== undefined && seriesName !== null
            )
            .map(async v => {
                const { seriesUID } = v;
                const { [seriesUID]: seriesFilterValue } = seriesFilter;

                const images = await getImages({
                    seriesUID
                });

                const imagesFiltered = images.filter(
                    ({ imageOrientation }) => imageOrientation
                );

                // TODO Grabbing middle image? probably a cleanner way. WG
                const {
                    [parseInt(imagesFiltered.length / 2)]: {
                        imageOrientation: [oX, oY] = [
                            { x: 0, y: 0, z: 0 },
                            { x: 0, y: 0, z: 0 }
                        ]
                    } = {}
                } = imagesFiltered;
                const direction = new Vector3().crossVectors(oX, oY);

                return { ...v, seriesFilter: seriesFilterValue, direction };
            })
    );

    const { 0: { seriesUID: firstSeriesUID } = [] } = dicomSeries;

    const { selectedSeries: projectSelectedSeries, series = [] } = project;

    const selectedSeries = dicomSeries.some(
        ({ seriesUID }) => seriesUID === projectSelectedSeries
    )
        ? projectSelectedSeries
        : firstSeriesUID;

    // Merge series states with dicom database
    const enhancedSeries = dicomSeries.map(v => {
        const lookupSeries =
            series.find(({ seriesUID }) => seriesUID === v.seriesUID) || {};

        return {
            ...v,
            ...lookupSeries
        };
    });

    // Send Payload first
    await new Promise((resolve, reject) => {
        socket.emit(
            "action",
            {
                type: "PROJECT_PAYLOAD",
                project: {
                    ...project,
                    selectedSeries,
                    series: enhancedSeries,
                    studyUID,
                    studyType
                }
            },
            () => resolve()
        );
    });

    const { sliceLocation = 0 } = project;

    if (dicomSeries.length > 0) {
        selectSeries({
            socket,
            action: { seriesUID: selectedSeries, sliceLocation, loadImages },
            adapter
        });
    }
};
