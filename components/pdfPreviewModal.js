import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import PDFJS from 'pdfjs-dist';
import axios from 'axios';

var id;
/**
 * open up the modal
 */
// export const showModal = (studyUID) => {
// 	id = studyUID;
// 	var modalElement =	document.getElementById("previewModal")
// 	modalElement.modal ({
// 		backdrop: true,
// 		keyboard: false
// 	});

// 	// TODO replace axios with React fetch
// 	axios.get(`http://localhost:3000/pdf/?id=${studyUID}`,{ responseType: 'arraybuffer' })
// 		.then(function (response) {		
// 			console.log (response);
// 			const data = new Uint8Array( response.data )
// 			const loadingTask = PDFJS.getDocument({data: data});
			
// 			loadingTask.promise.then(function(pdf) {
// 				console.log('PDF loaded');
				
// 				pdf.getPage(1).then(function(page) {
// 					console.log('Page loaded');
					
// 					const scale = 1.2;
// 					const viewport = page.getViewport(scale);
					
// 					const canvas = document.getElementById('the-canvas');
// 					const context = canvas.getContext('2d');
// 					canvas.height = viewport.height;
// 					canvas.width = viewport.width;
				
// 					const renderContext = {
// 						canvasContext: context,
// 						viewport: viewport
// 					};
// 					const renderTask = page.render(renderContext);
// 					renderTask.then(function () {
// 						console.log('Page rendered');
// 						// modalElement.style.display = (modalElement.style.display == "block") ? "hidden" : "block";
// 					});
// 				});
// 			}, function (reason) {
// 				// PDF loading error
// 				console.error(reason);
// 			});

// 		})
// 		.catch(function (error) {
// 			console.log(error);
// 		});
// }

// /**
//  * closes up the modal
//  */
// export const closeModal = () => document.getElementById("previewModal").style.display = "none"

// // trigger to download PDF
// const download = () => window.location = `/pdf/?id=${id}`

var overlay;
var id;
export const openModal = ( studyUID ) => {
	overlay = document.getElementById('overlay');
	id = studyUID;
	overlay.classList.remove("is-hidden");

	axios.get(`http://localhost:3000/pdf/?id=${studyUID}`,{ responseType: 'arraybuffer' })
			.then(function (response) {		
				console.log (response);
				const data = new Uint8Array( response.data )
				const loadingTask = PDFJS.getDocument({data: data});
				
				loadingTask.promise.then(function(pdf) {
					console.log('PDF loaded');
					
					pdf.getPage(1).then(function(page) {
						console.log('Page loaded');
						
						const scale = 1.2;
						const viewport = page.getViewport(scale);
						
						const canvas = document.getElementById('the-canvas');
						const context = canvas.getContext('2d');
						canvas.height = viewport.height;
						canvas.width = viewport.width;
					
						const renderContext = {
							canvasContext: context,
							viewport: viewport
						};
						const renderTask = page.render(renderContext);
						renderTask.then(function () {
							console.log('Page rendered');
							// modalElement.style.display = (modalElement.style.display == "block") ? "hidden" : "block";
						});
					});
				}, function (reason) {
					// PDF loading error
					console.error(reason);
				});
	
			})
			.catch(function (error) {
				console.log(error);
			});
}

export const closeModal = () => overlay.classList.add("is-hidden");

export const download = () => window.location = `/pdf/?id=${id}`

/**
 * @prop {any} data -> any data (specially keys)
 * @prop {actionCallback} -> callback for action to perform when clicked primary button
 */
export default ( { studyUID = undefined } ) => (
	<section className='overlay is-hidden' id='overlay'>
	<style jsx>{`
		.is-hidden { display: none; }
		
		.button-close {
			display: inline-block;
			width: 16px;
			height: 16px;
			position: absolute;
			top: 10px;
			right: 10px;
			cursor: pointer;
			background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAowAAAKMB8MeazgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAB5SURBVDiNrZPRCcAwCEQfnUiySAZuF8kSWeH6Yz8KrQZMQAicJ+epAB0YwAmYJKIADLic0/GPPCbQAnLznCd/4NWUFfkgy1VjH8CryA95ApYltAiTRCZxpuoW+gz9WXE6NPeg+ra1UDIxGlWEObe4SGxY5fIxlc75Bkt9V4JS7KWJAAAAAElFTkSuQmCC59ef34356faa7edebc7ed5432ddb673d');
		}
		
		.overlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			overflow-y: scroll;
			background: rgba(0,0,0,0.6);
		}
		
		.modal-content {
			padding: 20px 30px;
			width:800px;
			position: relative;
			min-height: 300px;
			margin: 5% auto 0;
			background: #fff;
		}
	`}</style>

	<section className="modal-content">
		<span className="button-close" onClick={() => closeModal()}></span>
		<h3>Modal Heading</h3>
		<section>
			<canvas id="the-canvas">Loading preview..</canvas>
			<Button onClick={() => download()}>Download</Button>
		</section>
	</section>
	
	</section>
	// <div id="previewModal" className="modal fade show" tabIndex={-1} role={'dialog'}>
	// 	<div className="modal-dialog modal-lg">
	// 		<div className="modal-content">
	// 			<div className="modal-header">
	// 				<button type="button" className="close" onClick={() => closeModal()}
	// 					data-dismiss="modal" aria-hidden="true">×</button>
	// 				<h4 className="modal-title">Browser Update</h4>
	// 			</div>
	// 			<div className="modal-body">
	// 				<canvas id="the-canvas"></canvas>
	// 				<p className="text-warning"><small>Would you like to Download it Now</small></p>
	// 			</div>
	// 			<div className="modal-footer">
	// 				<Button type="button" className="btn btn-default" data-dismiss="modal" onClick={() => download()}>Download</Button>
	// 			</div>
	// 		</div>
	// 	</div>
	// </div>
);