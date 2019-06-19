# IvyPinch

Javascript library for images scaling and dragging with touch screen gestures; API support for complex actions available. 

Live demo can be found on [home page](http://ivypinch.one).

## Installation

Install the npm package.

	npm i ivypinch

When initializing, enter a container selector and a [license key](http://ivypinch.one#license):

	var myPinch = new IvyPinch({
	    key: 'MY_KEY'
	    element: '.pinch-zoom'
	});

## Usage

Put an image inside the container, its content will be scaled with a pinch zoom after the library is initialized.

	<div class="pinch-zoom">
	    <img src="...">
	</div>

Initialize the library and pass the container selector as an argument.

	var myPinch = new IvyPinch({
	    element: '.pinch-zoom'
	});

Pay attention to the parameters of the viewport metatag, it is recommended to limit scaling of a web-page by entering the following parameters: 
	
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no">.

It is recommended to set the maximum height and width of an image with the CSS properties: 

	max-width: 100%; 
	max-height: 100%;

## License

You can freely use IvyPinch in non-commercial projects ([get a license key](http://ivypinch.one#license)) or on the localhost domain. You can also use a trial version on any other domain. 20 function calls are available in the trial version after each page load. For commercial projects the following two license types are available: for [one domain](http://ivypinch.one#license) and for an [unlimited number of domains](http://ivypinch.one#license).

## Properties

| name | type | default | description |
|------|------|---------|-------------|
| transitionDuration | number | 200 | Animation speed of scaling and aligning, in milliseconds. |
| autoZoomOut | boolean | false | Automatic restoration of the original size of an image after its zooming in by two fingers. |
| doubleTap | boolean | true | Scaling with double tap. |
| doubleTapScale | boolean | false | Zoom in factor for double tap. |
| limitZoom | number | 3 | Limitation of a maximum zoom in. |

## Methods

| name | description |
|------|-------------|
| setMoveX(value: number) | Shift an image in X-direction. |
| setMoveY(value: number) | Shift an image in Y-direction. |
| toggleZoom() | Image zooming in and out to the original scale, depending on its current scale. |
| alignImage() | Press images to the edges of the parental element. |

## Events

| name | description |
|------|-------------|
| touchstart | One or more touch points are placed on the touch surface. |
| touchend | One or more touch points are removed from the touch surface. |
| swipe | A user moves a zoomed image in any direction by a finger. |
| pinch | A user zooms an image in or out by two fingers. |
| double-tap | Double touch, consisting of two quick taps. |