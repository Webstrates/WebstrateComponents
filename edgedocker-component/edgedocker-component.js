/**
 *  EdgeDocker
 *  Provides Developer-Console-like behaviour in browsers
 * 
 *  Copyright 2020, 2021 Rolf Bagge, Janus B. Kristensen, CAVI,
 *  Center for Advanced Visualization and Interacion, Aarhus University
 *    
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
**/

/**
 * @typedef {object} EdgeDocker~config
 * @property {Element} [parent=html] - The parent to attach the docker too.
 * @property {EdgeDocker.MODE} [mode=RIGHT] - The edge to attach too.
 */

/**
 * EdgeDocker can dock its container along the edges of the browser, just like Dev console does.
 */
class EdgeDocker {
    /**
     * Create a new EdgeDocker
     * @param {EdgeDocker~config} options
     */
    constructor(options) {
        let self = this;

        this.parent = WebstrateComponents.Tools.fromConfig(options, "parent", document.querySelector("html"));

        // Add the resizer and content areas
        this.resizeHandle = document.createElement("transient");
        this.resizeHandle.classList.add("docking-area-resizer");
        this.parent.appendChild(this.resizeHandle);
        this.componentArea = document.createElement("transient");
        this.componentArea.classList.add("docking-area-component");
        this.parent.appendChild(this.componentArea);
        this.visualizerHandle = document.createElement("transient");
        this.visualizerHandle.classList.add("docking-area-visualizer");
        this.parent.appendChild(this.visualizerHandle);

        this.dragging = false;

        // init resize
        this.setupResizeHandle(this.resizeHandle);
        this.setMode(WebstrateComponents.Tools.fromConfig(options, "mode", EdgeDocker.MODE.RIGHT));

        this.positionAnimationFrame = null;
        this.boundsAnimationFrame = null;

        let oldStyleWidth = null;
        let oldStyleHeight = null;

        //Crude observer to check for docker resizeing
        let observer = new MutationObserver(()=>{
            let doEvent = false;


            if(self.boundsAnimationFrame != null) {
                cancelAnimationFrame(this.boundsAnimationFrame);
                self.boundsAnimationFrame = null;
            }

            self.boundsAnimationFrame = requestAnimationFrame(()=>{
                if(self.componentArea.style.width != oldStyleWidth) {
                    doEvent = true;
                    oldStyleWidth = parseInt(self.componentArea.style.width);
                }

                if(self.componentArea.style.height != oldStyleHeight) {
                    doEvent = true;
                    oldStyleHeight = parseInt(self.componentArea.style.height);
                }

                if(doEvent) {
                    self.setBounds(parseInt(this.componentArea.style.left), parseInt(this.componentArea.style.top), oldStyleWidth, oldStyleHeight);
                    window.dispatchEvent(new Event('resize'));
                }
            });
        });

        observer.observe(this.componentArea, {
            attributes: true,
            attributeFilter: ["style"]
        });
    }

    setupResizeHandle() {
        let self = this;
        
        this.resizeAnimFrame = null;
        
        let preventEvents = ["move"];
        if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
            preventEvents.push("down");
        }
        
        this.deltaWidth = 0;
        this.deltaHeight = 0;

        new CaviTouch(this.resizeHandle, {
            minDragDistance: 0
        });

        this.resizeHandle.addEventListener("caviDrag", (evt)=>{
            switch(self.currentMode) {
                case EdgeDocker.MODE.MAXIMIZED:
                    break;
                case EdgeDocker.MODE.BOTTOM:
                    self.deltaHeight -= evt.detail.caviEvent.deltaPosition.y;
                    break;
                case EdgeDocker.MODE.LEFT:
                    self.deltaWidth += evt.detail.caviEvent.deltaPosition.x;
                    break;
                case EdgeDocker.MODE.RIGHT:
                    self.deltaWidth -= evt.detail.caviEvent.deltaPosition.x;
                    break;
                case EdgeDocker.MODE.FLOAT:
                    self.deltaWidth += evt.detail.caviEvent.deltaPosition.x;
                    self.deltaHeight += evt.detail.caviEvent.deltaPosition.y;
                    break;
            }
            
            if(self.resizeAnimFrame === null) {
                cancelAnimationFrame(self.resizeAnimFrame);
            }
            self.resizeAnimFrame = requestAnimationFrame(()=>{
                self.resizeAnimFrame = null;
                let width = self.componentArea.offsetWidth + self.deltaWidth;
                let height = self.componentArea.offsetHeight + self.deltaHeight;
                
                self.deltaWidth = 0;
                self.deltaHeight = 0;

                this.setBounds(parseInt(this.componentArea.style.left), parseInt(this.componentArea.style.top), width, height);
                /*
                self.componentArea.style.width = width+"px";
                self.componentArea.style.height = height+"px";
                */
            });
        });
    }
    
    setupDragHandle(element) {
        let self = this;

        new CaviTouch(element, {
            preventDefaultEvents: []
        });

        let currentSelectedMode = null;
        let oldSelectedMode = null;

        let currentX = 0;
        let currentY = 0;
        
        element.addEventListener("caviDoubleTap", ()=>{
            if(self.currentMode !== EdgeDocker.MODE.MAXIMIZED){
                self.setMode(EdgeDocker.MODE.MAXIMIZED);
            } else {
                self.setMode(EdgeDocker.MODE.FLOAT);
            }
        });

        element.addEventListener("caviDragStart", (evt)=>{
            self.dragging = true;

            oldSelectedMode = self.currentMode;

            if(self.currentMode !== EdgeDocker.MODE.FLOAT) {
                self.setMode(EdgeDocker.MODE.FLOAT);

                let bounds = element.getBoundingClientRect();

                self.setPosition(evt.detail.caviEvent.position.x-bounds.width / 2.0, evt.detail.caviEvent.position.y-bounds.height / 2.0, true);
            }

            self.parent.setAttribute("transient-data-docking-area-component-drag", "dragging");

            let bounds = self.componentArea.getBoundingClientRect();
            currentX = bounds.x;
            currentY = bounds.y;
        });

        element.addEventListener(("caviDrag"), (evt)=>{
            let percentWidth = self.parent.offsetWidth * 0.1;
            let percentHeight = self.parent.offsetHeight * 0.1;

            currentX += evt.detail.caviEvent.deltaPosition.x;
            currentY += evt.detail.caviEvent.deltaPosition.y;

            if(evt.detail.caviEvent.position.x < percentWidth) {
                self.parent.setAttribute("transient-data-docking-area-component-drag", "dragging left");
                currentSelectedMode = EdgeDocker.MODE.LEFT;
            } else if(self.parent.offsetWidth - evt.detail.caviEvent.position.x < percentWidth) {
                self.parent.setAttribute("transient-data-docking-area-component-drag", "dragging right");
                currentSelectedMode = EdgeDocker.MODE.RIGHT;
            } else if(evt.detail.caviEvent.position.y - self.parent.scrollTop < percentHeight) {
                self.parent.setAttribute("transient-data-docking-area-component-drag", "dragging maximized");
                currentSelectedMode = EdgeDocker.MODE.MAXIMIZED;
            } else if(self.parent.offsetHeight - (evt.detail.caviEvent.position.y - self.parent.scrollTop) < percentHeight) {
                self.parent.setAttribute("transient-data-docking-area-component-drag", "dragging bottom");
                currentSelectedMode = EdgeDocker.MODE.BOTTOM;
            } else {
                self.parent.setAttribute("transient-data-docking-area-component-drag", "dragging float");
                currentSelectedMode = EdgeDocker.MODE.FLOAT;
            }

            self.setPosition(currentX, currentY);
        });

        element.addEventListener("caviDragStop", (evt)=>{

            self.setMode(currentSelectedMode, false);

            if(oldSelectedMode !== currentSelectedMode) {
                self.saveMode();
            }

            if(currentSelectedMode === EdgeDocker.MODE.FLOAT) {
                self.saveBounds(currentSelectedMode, true);
            }

            self.parent.setAttribute("transient-data-docking-area-component-drag", "");

            if(currentSelectedMode === EdgeDocker.MODE.FLOAT) {
                self.setPosition(currentX, currentY, true);
            }

            setTimeout(()=>{
                self.dragging = false;
            });
        });
        
        element.style.cursor = "move";
    }

    /**
     * Sets the position of this EdgeDocker, Ignored if not in FLOAT mode
     * @param {Number} x
     * @param {Number} y
     */
    setPosition(x, y, immediately=false) {
        if(this.currentMode === EdgeDocker.MODE.FLOAT) {
            let self = this;

            if(this.positionAnimationFrame != null) {
                cancelAnimationFrame(this.positionAnimationFrame);
                this.positionAnimationFrame = null;
            }

            if(immediately) {
                self.componentArea.style.left = x + "px";
                self.componentArea.style.top = y + "px";
                self.visualizerHandle.style.left = x + "px";
                self.visualizerHandle.style.top = y + "px";
            } else {
                this.positionAnimationFrame = requestAnimationFrame(()=>{
                    if(self.currentMode === EdgeDocker.MODE.FLOAT) {
                        self.componentArea.style.left = x + "px";
                        self.componentArea.style.top = y + "px";
                        self.visualizerHandle.style.left = x + "px";
                        self.visualizerHandle.style.top = y + "px";
                    }
                });
            }
        }
    }

    /**
     * Sets the bounds of this EdgeDocker
     * @param {Number} x
     * @param {Number} y
     * @param {Number} width
     * @param {Number} height
     * @param {boolean} [doSave=true] - Determines if the bounds should be saved or not
     */
    setBounds(x, y, width, height, doSave = true) {
        this.setPosition(x, y, true);

        let maxWidth = this.parent.offsetWidth * 0.8;
        let maxHeight = this.parent.offsetHeight * 0.8;

        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);

        switch(this.currentMode) {
            case EdgeDocker.MODE.LEFT:
            case EdgeDocker.MODE.RIGHT:
                //Only Set Width
                this.componentArea.style.width = width + "px";
                break;

            case EdgeDocker.MODE.BOTTOM:
                //Only Set height
                this.componentArea.style.height = height + "px";
                break;

            case EdgeDocker.MODE.FLOAT:
                //Set Width and Height
                this.componentArea.style.width = width + "px";
                this.componentArea.style.height = height + "px";
                break;
        }

        if(doSave) {
            this.saveBounds(this.currentMode);
        }
    }

    /**
     * Sets the current dock mode of this EdgeDocker
     * @param {EdgeDocker.MODE} mode
     * @param {boolean} [doLoad=true] - Determines if this setMode should load bounds from storage or not.
     */
    setMode(mode, doLoad = true){
        let oldWidth = parseInt(this.componentArea.style.height);
        let oldHeight = parseInt(this.componentArea.style.width);
        let oldMode = this.currentMode;

        this.parent.setAttribute("transient-data-docking-area-component-mode", mode);
        this.currentMode = mode;

        if(this.currentMode === EdgeDocker.MODE.MAXIMIZED || this.currentMode === EdgeDocker.MODE.EMBEDDED) {
            this.componentArea.style.width = "";
            this.componentArea.style.height = "";
        } else if(this.currentMode === EdgeDocker.MODE.LEFT || this.currentMode === EdgeDocker.MODE.RIGHT) {
            this.componentArea.style.height = "";
            this.componentArea.style.width = (this.parent.offsetWidth*0.5)+"px"; //Overidden if any saved mode exists
        } else if(this.currentMode === EdgeDocker.MODE.BOTTOM) {
            this.componentArea.style.width = "";
            this.componentArea.style.height = (this.parent.offsetHeight*0.33)+"px"; //Overidden if any saved mode exists
        } else if(this.currentMode === EdgeDocker.MODE.FLOAT && oldMode !== EdgeDocker.MODE.FLOAT) {
            this.componentArea.style.width = "";
            this.componentArea.style.height = "";
        }
        
        if (this.currentMode !== EdgeDocker.MODE.FLOAT){
            this.componentArea.style.top = null;
            this.componentArea.style.left = null;
        }

        if(doLoad) {
            this.loadBounds(this.currentMode);
        }

        window.dispatchEvent(new Event('resize'));
    }
    
    dockInto(parentElement){
        if (parentElement){
            // Move into the element if one is given
            parentElement.appendChild(this.componentArea);
        } else {
            // Default to being shown before the visualizer
            this.visualizerHandle.parentElement.insertBefore(this.componentArea, this.visualizerHandle);
        }
    }

    loadBounds(mode) {
        let key = location.pathname + "_" + mode;

        let bounds = localStorage.getItem(key);

        if(bounds != null) {
            try {
                bounds = JSON.parse(bounds);
                this.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
            } catch(e) {
                console.error(e);
            }
        }
    }

    saveBounds(mode, forceSave = false) {
        if(this.dragging && !forceSave) {
            return;
        }

        let key = location.pathname + "_" + mode;

        let bounds = this.componentArea.getBoundingClientRect();

        localStorage.setItem(key, JSON.stringify(bounds));
    }

    /**
     * Save the current mode
     */
    saveMode() {
        let key = location.pathname + "_Mode";
        localStorage.setItem(key, this.currentMode);
    }

    /**
     * Load the saved mode, or use fallback if no saved mode
     * @param {EdgeDocker.MODE} fallback - The mode to use if none is saved.
     */
    loadMode(fallback) {
        let key = location.pathname + "_Mode";
        let mode = localStorage.getItem(key);
        if(mode != null) {
            this.setMode(mode);
        } else {
            this.setMode(fallback);
        }
    }

    /**
     * Fetch the component area where DOM elements can be added to this EdgeDocker
     * @returns {HTMLElement}
     */
    getComponentArea(){
        return this.componentArea;
    }
}

/**
 * The supported modes of EdgeDocker
 * @readonly
 * @enum
 */
EdgeDocker.MODE = {
    MAXIMIZED: "maximized",
    MINIMIZED: "minimized",
    LEFT: "left edge",
    RIGHT: "right edge",
    BOTTOM: "bottom edge",
    FLOAT: "floating",
    EMBEDDED: "embedded"
};

window.EdgeDocker = EdgeDocker;