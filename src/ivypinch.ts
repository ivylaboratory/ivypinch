var IvyTouch = require('./ivytouch/ivytouch-obf.min');

export interface IvyPinchProperties {
    element: string;
    key ? : string;
    doubleTap ? : boolean;
    doubleTapScale: number;
    transitionDuration: number;
    autoZoomOut ? : boolean;
    limitZoom: number;
}

export const IvyPinchDefaultProperties = {
    doubleTap: true,
    doubleTapScale: 2,
    transitionDuration: 200,
    limitZoom: 3
}

type EventType = undefined | 'pan' | 'pinch' | 'horizontal-swipe' | 'vertical-swipe' | 'touchend';

export class IvyPinch {
    properties: IvyPinchProperties;
    ivyTouch: any; // Library for touch type detection 
    element: HTMLElement;
    elementTarget: string; // Name for scalable tag
    parentElement: HTMLElement;
    i: number = 0;
    scale: number = 1;
    initialScale: number = 1;
    elementPosition: ClientRect;
    eventType: EventType = undefined;
    startX: number = 0; // X coordinate start touch
    startY: number = 0;
    moveX: number = 0; // X coordinate of new image position
    moveY: number = 0;
    initialMoveX: number = 0;
    initialMoveY: number = 0;
    moveXC: number = 0; // Center of X coordinates of two touches
    moveYC: number = 0;
    lastTap: number = 0;
    draggingMode: boolean = false;
    distance: number = 0; // Distance between two touches
    doubleTapTimeout: number = 0;
    initialDistance: number = 0;
    linearHorizontalSwipe: boolean = true;
    linearVerticalSwipe: boolean = true;
    events: any = {};

    get isTouchScreen() {
        const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');

        if (('ontouchstart' in window)) {
            return true;
        }

        // include the 'heartz' as a way to have a non matching MQ to help terminate the join
        // https://git.io/vznFH
        const query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return this.getMatchMedia(query);
    }

    get isDragging() {
        const imgHeight = this.getImageHeight();
        const imgWidth = this.getImageWidth();

        if (this.scale > 1) {
            return imgHeight * this.scale > this.parentElement.offsetHeight ||
                imgWidth * this.scale > this.parentElement.offsetWidth;
        }
        if (this.scale === 1) {
            return imgHeight > this.parentElement.offsetHeight ||
                imgWidth > this.parentElement.offsetWidth;
        }
    }

    constructor(properties: any) {
        this.element = document.querySelector(properties.element);
        this.elementPosition = this.getElementPosition();
        this.elementTarget = this.getTagName(this.element);

        this.parentElement = this.getParentElement();
        this.properties = this.getDefaultProperties(properties);

        this.ivyTouch = new IvyTouch.IvyTouch({
            element: document.querySelector(properties.element),
            key: properties.key
        });


        /* Style initialization */

        this.setBasicStyles();


        /* Listeners */

        this.ivyTouch.on('touchstart', this.handleTouchstart);
        this.ivyTouch.on('touchend', this.handleTouchend);
        this.ivyTouch.on('pan', this.handlePan);
        this.ivyTouch.on('pinch', this.handlePinch);

        if (this.properties.doubleTap) {
            this.ivyTouch.on('double-tap', this.handleDoubleTap);
        }
    }


    /* Custom events */

    emitEvent(properties: any) {
        this.events[properties.name] = new CustomEvent(properties.name, {
            'detail': properties.detail
        });
        this.element.dispatchEvent(this.events[properties.name]);
    }


    /* Touchstart */

    handleTouchstart = (event: any) => {
        this.elementPosition = this.getElementPosition();

        if (this.eventType === undefined) {
            [this.startX, this.startY] = this.getTouchstartPosition(event);
        }
    }


    /* Touchend */

    handleTouchend = (event: any) => {
        this.i = 0;
        this.draggingMode = false;
        const touches = event.touches;

        // Min scale
        if (this.scale < 1) {
            this.scale = 1;
        }

        // Auto Zoom Out
        if (this.properties.autoZoomOut && this.eventType === 'pinch') {
            this.scale = 1;
        }

        // Align image
        if (this.eventType === 'pinch' || this.eventType === 'pan') {
            this.alignImage();
        }

        // Limit Zoom
        if (this.properties.limitZoom && this.eventType === 'pinch') {
            this.handleLimitZoom();
        }

        // Update initial values
        if (this.eventType === 'pinch' ||
            this.eventType === 'pan' ||
            this.eventType === 'horizontal-swipe' ||
            this.eventType === 'vertical-swipe') {

            this.updateInitialValues();
        }

        this.eventType = 'touchend';

        if (touches && touches.length === 0) {
            this.eventType = undefined;
        }
    }


    /*
     * Handlers
     */

    handlePan = (event: any) => {
        if (this.scale <= 1) {
            return;
        }

        event.preventDefault();

        if (!this.eventType) {
            this.startX = event.touches[0].clientX - this.elementPosition.left;
            this.startY = event.touches[0].clientY - this.elementPosition.top;
        }

        this.eventType = 'pan';
        this.moveX = this.initialMoveX + (this.moveLeft(0, event.touches) - this.startX);
        this.moveY = this.initialMoveY + (this.moveTop(0, event.touches) - this.startY);

        this.emitEvent({
            name: 'pan',
            detail: {
                moveX: this.moveX,
                moveY: this.moveY
            }
        });
        this.transformElement(0);
    }

    handlePinch = (event: any) => {
        event.preventDefault();
        const touches = event.touches;

        if (!this.eventType) {
            this.initialDistance = this.getDistance(touches);

            const moveLeft0 = this.moveLeft(0, touches);
            const moveLeft1 = this.moveLeft(1, touches);
            const moveTop0 = this.moveTop(0, touches);
            const moveTop1 = this.moveTop(1, touches);

            this.moveXC = ((moveLeft0 + moveLeft1) / 2) - this.initialMoveX;
            this.moveYC = ((moveTop0 + moveTop1) / 2) - this.initialMoveY;
        }

        this.eventType = 'pinch';
        this.distance = this.getDistance(touches);
        this.scale = this.initialScale * (this.distance / this.initialDistance);
        this.moveX = this.initialMoveX - (((this.distance / this.initialDistance) * this.moveXC) - this.moveXC);
        this.moveY = this.initialMoveY - (((this.distance / this.initialDistance) * this.moveYC) - this.moveYC);

        this.emitEvent({
            name: 'pinch',
            detail: {
                scale: this.scale
            }
        });
        this.transformElement(0);
    }

    handleDoubleTap = (event: any) => {
        this.emitEvent({
            name: 'double-tap'
        });
        this.toggleZoom(event);
        return;
    }

    handleLinearSwipe = (event: any) => {
        if (this.scale > 1) {
            return;
        }

        if (this.linearVerticalSwipe) {
            event.preventDefault();
        }

        const clientX = event.touches[0].clientX;
        const clientY = event.touches[0].clientY;

        this.i++;

        // Note: there are problems with linear swipe, when moving types are mixed
        if (this.i > 3) {
            this.eventType = event.swipeType; // getLinearSwipeType(event);
        }

        if (this.eventType === 'horizontal-swipe') {
            this.moveX = this.initialMoveX + ((clientX - this.elementPosition.left) - this.startX);
            this.moveY = 0;
        }

        if (this.eventType === 'vertical-swipe') {
            this.moveX = 0;
            this.moveY = this.initialMoveY + ((clientY - this.elementPosition.top) - this.startY);
        }

        if (this.eventType) {
            this.transformElement(0);
        }
    }

    handleLimitZoom(): void {
        if (this.properties.limitZoom === undefined) {
            return;
        }

        if (this.scale > this.properties.limitZoom) {
            const imageWidth = this.getImageWidth();
            const imageHeight = this.getImageHeight();
            const enlargedImageWidth = imageWidth * this.scale;
            const enlargedImageHeight = imageHeight * this.scale;

            const moveXRatio = this.moveX / (enlargedImageWidth - imageWidth);
            const moveYRatio = this.moveY / (enlargedImageHeight - imageHeight);

            this.scale = this.properties.limitZoom;

            const newImageWidth = imageWidth * this.scale;
            const newImageHeight = imageHeight * this.scale;

            this.moveX = -Math.abs((moveXRatio * (newImageWidth - imageWidth)));
            this.moveY = -Math.abs((-moveYRatio * (newImageHeight - imageHeight)));

            this.centeringImage();
            this.transformElement(this.properties.transitionDuration);
        }
    }

    moveLeft(index: number, touches: TouchList) {
        return touches[index].clientX - this.elementPosition.left;
    }

    moveTop(index: number, touches: TouchList) {
        return touches[index].clientY - this.elementPosition.top;
    }


    /*
     * Detection
     */

    detectLinearSwipe(touches: TouchList): boolean {
        return touches.length === 1 && this.scale === 1 && !this.eventType;
    }


    getLinearSwipeType(event: any): EventType {
        if (this.eventType !== 'horizontal-swipe' && this.eventType !== 'vertical-swipe') {
            const movementX = Math.abs(this.moveLeft(0, event.touches) - this.startX);
            const movementY = Math.abs(this.moveTop(0, event.touches) - this.startY);

            if ((movementY * 3) > movementX) {
                return this.linearVerticalSwipe ? 'vertical-swipe' : undefined;
            } else {
                return this.linearHorizontalSwipe ? 'horizontal-swipe' : undefined;
            }
        } else {
            return this.eventType;
        }
    }

    centeringImage(): boolean {
        const img = this.element.getElementsByTagName(this.elementTarget)[0];
        const initialMoveX = this.moveX;
        const initialMoveY = this.moveY;

        if (this.moveY > 0) {
            this.moveY = 0;
        }
        if (this.moveX > 0) {
            this.moveX = 0;
        }

        if (img) {
            this.transitionYRestriction();
            this.transitionXRestriction();
        }
        if (img && this.scale < 1) {
            if (this.moveX < this.element.offsetWidth * (1 - this.scale)) {
                this.moveX = this.element.offsetWidth * (1 - this.scale);
            }
        }

        return initialMoveX !== this.moveX || initialMoveY !== this.moveY;
    }

    transitionYRestriction(): void {
        const imgHeight = this.getImageHeight();

        if (imgHeight * this.scale < this.parentElement.offsetHeight) {
            this.moveY = (this.parentElement.offsetHeight - this.element.offsetHeight * this.scale) / 2;
        } else {
            const imgOffsetTop = ((imgHeight - this.element.offsetHeight) * this.scale) / 2;

            if (this.moveY > imgOffsetTop) {
                this.moveY = imgOffsetTop;
            } else if ((imgHeight * this.scale + Math.abs(imgOffsetTop) - this.parentElement.offsetHeight) + this.moveY < 0) {
                this.moveY = -(imgHeight * this.scale + Math.abs(imgOffsetTop) - this.parentElement.offsetHeight);
            }
        }
    }

    transitionXRestriction(): void {
        const imgWidth = this.getImageWidth();

        if (imgWidth * this.scale < this.parentElement.offsetWidth) {
            this.moveX = (this.parentElement.offsetWidth - this.element.offsetWidth * this.scale) / 2;
        } else {
            const imgOffsetLeft = ((imgWidth - this.element.offsetWidth) * this.scale) / 2;

            if (this.moveX > imgOffsetLeft) {
                this.moveX = imgOffsetLeft;
            } else if ((imgWidth * this.scale + Math.abs(imgOffsetLeft) - this.parentElement.offsetWidth) + this.moveX < 0) {
                this.moveX = -(imgWidth * this.scale + Math.abs(imgOffsetLeft) - this.parentElement.offsetWidth);
            }
        }
    }

    setBasicStyles(): void {
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.transformOrigin = '0 0';

        this.setImageWidth();
    }

    setImageWidth(): void {
        const imgElement = this.element.getElementsByTagName(this.elementTarget) as HTMLCollectionOf<HTMLElement>;;

        if (imgElement.length) {
            imgElement[0].style.maxWidth = '100%';
            imgElement[0].style.maxHeight = '100%';
        }
    }

    getElementPosition() {
        const parentElement = this.element.parentElement;
        if (parentElement) {
            return parentElement.getBoundingClientRect();
        } else {
            return this.element.getBoundingClientRect();
        }
    }

    getTouchstartPosition(event: any) {
        const clientX = event.touches[0].clientX;
        const clientY = event.touches[0].clientY;

        let startX = clientX - this.elementPosition.left;
        let startY = clientY - this.elementPosition.top;
        return [startX, startY];
    }

    resetScale(): void {
        this.scale = 1;
        this.moveX = 0;
        this.moveY = 0;
        this.updateInitialValues();
        this.transformElement(this.properties.transitionDuration);
    }

    updateInitialValues(): void {
        this.initialScale = this.scale;
        this.initialMoveX = this.moveX;
        this.initialMoveY = this.moveY;
    }

    getDistance(touches: TouchList) {
        const pageX = [touches[0].pageX, touches[1].pageX];
        const pageY = [touches[0].pageY, touches[1].pageY];

        return Math.sqrt(Math.pow(pageX[0] - pageX[1], 2) + Math.pow(pageY[0] - pageY[1], 2));
    }

    getImageHeight(): number {
        return this.element.offsetHeight;
    }

    getImageWidth(): number {
        return this.element.offsetWidth;
    }

    transformElement(duration: number) {
        this.element.style.transition = "all " + duration + "ms";
        this.element.style.transform = "matrix(" + Number(this.scale) + ", 0, 0, " + Number(this.scale) + ", " + Number(this.moveX) + ", " + Number(this.moveY) + ")";
    }

    getMatchMedia(query: any) {
        return window.matchMedia(query).matches;
    }

    getTagName(element: HTMLElement) {
        const elementTag = < HTMLElement > element.querySelector('*');
        return elementTag.tagName;
    }

    getDefaultProperties(properties: IvyPinchProperties) {
        return Object.assign({}, IvyPinchDefaultProperties, properties);
    }

    getParentElement(): HTMLElement {
        if (this.element.parentElement) {
            return this.element.parentElement;
        } else {
            return this.element;
        }
    }


    /* Public properties and methods */

    public setMoveX(value: number, transitionDuration: number): void {
        this.moveX = value;
        this.transformElement(transitionDuration || this.properties.transitionDuration);
    }

    public setMoveY(value: number, transitionDuration: number): void {
        this.moveY = value;
        this.transformElement(transitionDuration || this.properties.transitionDuration);
    }

    public toggleZoom(event: any): void {
        if (this.initialScale === 1) {

            if (event && event.changedTouches) {
                if (this.properties.doubleTapScale === undefined) {
                    return;
                }

                const changedTouches = event.changedTouches;
                this.scale = this.initialScale * this.properties.doubleTapScale;
                this.moveX = this.initialMoveX - (changedTouches[0].clientX * (this.properties.doubleTapScale - 1) - this.elementPosition.left);
                this.moveY = this.initialMoveY - (changedTouches[0].clientY * (this.properties.doubleTapScale - 1) - this.elementPosition.top);
            } else {
                this.scale = this.initialScale * 2;
                this.moveX = this.initialMoveX - this.element.offsetWidth / 2;
                this.moveY = this.initialMoveY - this.element.offsetHeight / 2;
            }

            this.centeringImage();
            this.updateInitialValues();
            this.emitEvent({
                name: 'zoom-in'
            });
            this.transformElement(this.properties.transitionDuration);
        } else {
            this.emitEvent({
                name: 'zoom-out'
            });
            this.resetScale();
        }
    }

    public alignImage(): void {
        const isMoveChanged = this.centeringImage();

        if (isMoveChanged) {
            this.updateInitialValues();
            this.transformElement(this.properties.transitionDuration);
        }
    }
}