/**
 *  TreeBrowser
 *  A navigation tool for presenting data as tree structures
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

/* global mdc */

/**
 * Called when a TreeNode is selected in a TreeBrowser
 *
 * @event TreeBrowser#EventSystem:"TreeBrowser.Selection"
 * @type {CustomEvent}
 * @property {TreeNode} selection - The selected TreeNode
 */

/**
 * Called when a TreeNode's action is triggered. (Ie. double click it)
 *
 * @event TreeNode#EventSystem:"TreeBrowser.TreeNode.Action"
 * @type {CustomEvent}
 * @property {TreeNode} node - The node which had its action triggered
 */

/**
 * TreeBrowser can take a TreeNode and construct a browsable tree
 */
class TreeBrowser {
    /**
     * Create a TreeBrowser with the given TreeNode as root
     *
     * @param {TreeNode} rootNode
     * @param {TreeBrowser~options} options
     */
    constructor(rootNode) {
        let self = this;

        /** @member {TreeNode} - The root node used to build the tree */
        this.rootNode = rootNode;

        /** @member {Element} - The DOM Element of this Tree */
        this.html = WebstrateComponents.Tools.loadTemplate("TreeBrowser_Main");

        /** @member {MDCList} - The MDCList object from Material Design */
        this.mdcList = new mdc.list.MDCList(this.html);
        this.mdcList.singleSelection = true;
        
        this.html.mdcList = this.mdcList;

        this.mdcList.listen("MDCList:action", (evt)=>{
            let listItem = self.mdcList.listElements[evt.detail.index];

            EventSystem.triggerEvent("TreeBrowser.Selection", {
                selection: listItem.treeNode
            });
        });

        this.rootNode.insertIntoDom(this.html, null);

        this.rootNode.treeBrowser = this;

        this.html.treeBrowser = this;

        this.html.addEventListener("keyup", (evt)=>{
            let selectedItem = self.mdcList.listElements[self.mdcList.selectedIndex];

            if(selectedItem == null) {
                return;
            }

            EventSystem.triggerEvent("TreeBrowser.Keyup", {
                evt: evt,
                treeNode: selectedItem.treeNode
            });

            if(evt.key === "Enter") {
                selectedItem.treeNode.triggerAction();
            } else if(evt.key === "ArrowRight") {
                selectedItem.treeNode.unfold();
            } else if(evt.key === "ArrowLeft") {
                selectedItem.treeNode.fold();
            } else if(evt.key === "ArrowDown") {
                let focusedItem = self.mdcList.listElements[self.mdcList["foundation"].adapter.getFocusedElementIndex()];
                if(focusedItem != null) {
                    self.setSelected(focusedItem.treeNode);
                }
            } else if(evt.key === "ArrowUp") {
                let focusedItem = self.mdcList.listElements[self.mdcList["foundation"].adapter.getFocusedElementIndex()];
                if(focusedItem != null) {
                    self.setSelected(focusedItem.treeNode);
                }
            }
        });

        this.html.addEventListener("keydown", (evt)=>{
            let selectedItem = self.mdcList.listElements[self.mdcList.selectedIndex];

            if(selectedItem == null) {
                return;
            }

            EventSystem.triggerEvent("TreeBrowser.Keydown", {
                evt: evt,
                treeNode: selectedItem.treeNode
            });
        });
    }

    /**
     * Sets the given TreeNode as the current selection
     * @param {TreeNode} treeNode
     */
    setSelected(treeNode) {
        let index = -1;

        let i = 0;
        this.html.mdcList.listElements.forEach((elm)=>{
            if(elm === treeNode.html) {
                index = i;
            }

            i++;
        });

        if(index !== -1) {
            this.mdcList.selectedIndex = index;
            this.mdcList.foundation.adapter.focusItemAtIndex(index);
            EventSystem.triggerEvent("TreeBrowser.Selection", {
                selection: treeNode
            });
        }
    }

    /**
     * Finds all TreeNode's that has the given context
     * @param context
     * @returns {TreeNode[]}
     */
    findTreeNodeForContext(context) {
        function lookupContext(node) {
            let foundNodes = [];

            if(node.context === context) {
                foundNodes.push(node);
            }

            for(let child of node.childNodes) {
                foundNodes.push(...lookupContext(child));
            }

            return foundNodes;
        }

        return lookupContext(this.rootNode);
    }
    
    /**
     * Finds all TreeNodes that have the given lookupKey
     * @param key
     * @returns {TreeNode[]}
     */
    findTreeNode(lookupKey) {
        function lookupTheLookupKey(node) {
            let foundNodes = [];

            if(node.lookupKey === lookupKey) {
                foundNodes.push(node);
            }

            for(let child of node.childNodes) {
                foundNodes.push(...lookupTheLookupKey(child));
            }

            return foundNodes;
        }

        return lookupTheLookupKey(this.rootNode);
    }    

    /**
     * Find all TreeBrowsers currently in the DOM
     * @returns {TreeBrowser[]}
     */
    static findAllTreeBrowsers() {
        return Array.from(document.querySelectorAll(".tree-browser-root")).map((dom)=>{
            return dom.treeBrowser;
        });
    }
}

window.TreeBrowser = TreeBrowser;

/**
 * @typedef {Object} TreeNode~config
 * @property {string} type - The type of this TreeNode, ex. "DomTreeNode", "AssetNode", "AssetRootNode"
 * @property {*} context - The context of this TreeNode
 * @property {boolean} [alwaysOpen=false] - If this TreeNode should stay unfolded
 * @property {*} [lookupKey=context] - The lookupkey to use when TreeGenerator saves this TreeNode for later lookup
 * @property {boolean} [startOpen=false] - If this TreeNode should start unfolded
 * @property {boolean} [hideSelf=false] - If this TreeNode should be hidden.
 */

/**
 * Represents a tree node
 */
class TreeNode {
    /**
     * Create a new TreeNode with the given configuration
     * @param {TreeNode~config} config - The configuration for this TreeNode
     */
    constructor(config) {
        let self = this;

        this.config = config;

        /** @memeber {string} - The type of this TreeNode */
        this.type = this.getProperty("type");
        /** @memeber {*} - The context of this TreeNode */
        this.context = this.getProperty("context");

        /** @memeber {boolean} - If this TreeNode should always stay unfolded */
        this.alwaysOpen = this.getProperty("alwaysOpen", false);

        this.startOpen = this.getProperty("startOpen", false);

        this.lookupKey = this.getProperty("lookupKey", this.context);

        /** @member {TreeNode[]} - The children of this TreeNode */
        this.childNodes = [];

        /** @member {Element} - The DOM Element of this TreeNode */
        this.html = WebstrateComponents.Tools.loadTemplate("TreeBrowser_Leaf");
        this.html.treeNode = this;

        this.hideSelf = this.getProperty("hideSelf", false);

        this.childrenHtml = WebstrateComponents.Tools.loadTemplate("TreeBrowser_Children");
        this.childrenUl = this.childrenHtml.querySelector("ul.tree-browser");

        /** @member {TreeNode} - The parent node of this TreeNode */
        this.parentNode = null;

        /** @member {Element[]} - Meta icons of this TreeNode */
        this.metaIcons = [];

        this.html.addEventListener("mouseup", (evt)=>{
            if(evt.button === 2) {
                self.select();
            }
        });

        this.onDecoratedCallbacks = new Set();

        self.html.querySelector(".tree-browser-navigator").addEventListener("click", ()=>{
            if(!self.isLeaf()) {
                if(self.alwaysOpen) {
                    self.unfold();
                } else {
                    self.toggleFold();
                }
            }
        });

        if(this.startOpen) {
            this.unfold();
            console.log("Opening up!");
        } else {
            this.fold();
        }

        this.setupContextMenu();

        this.setupMetaMenu();

        this.setupDragging();

        this.render();

        this.setupClickListeners();
    }

    get hideSelf() {
        return this.html.classList.contains("tree-browser-node-hidden");
    }

    set hideSelf(hide) {
        if(hide) {
            this.html.classList.add("tree-browser-node-hidden");
        } else {
            this.html.classList.remove("tree-browser-node-hidden");
        }
    }

    /**
     * Return the TreeBrowser at the top of the tree this TreeNode is in, if any
     * @returns {null|TreeBrowser}
     */
    getTreeBrowser() {
        if(this.treeBrowser != null) {
            return this.treeBrowser;
        } else if(this.parentNode != null) {
            return this.parentNode.getTreeBrowser();
        }

        return null;
    }

    /**
     * @private
     * @param parent
     */
    insertIntoDom(parent) {
        parent.appendChild(this.html);
        parent.insertBefore(this.childrenHtml, this.html.nextElementSibling);
    }

    /**
     * @private
     */
    removeFromDom() {
        this.html.remove();
        this.childrenHtml.remove();
        if(this.nextAnimFrame != null) {
            cancelAnimationFrame(this.nextAnimFrame);
            this.nextAnimFrame = null;
        }
    }

    /**
     * Retrieve the value of the given property
     * @param {String} propertyName
     * @param {*} [defaultValue] - The default value if the property does not exist
     * @returns {*}
     */
    getProperty(propertyName, defaultValue = null) {
        return WebstrateComponents.Tools.fromConfig(this.config, propertyName, defaultValue);
    }

    /**
     * Sets the value of the given property
     * @param {String} propertyName
     * @param {*} value
     */
    setProperty(propertyName, value) {
        this.config[propertyName] = value;
    }

    /**
     * Add a meta icon to this TreeNode
     * @param {*} icon
     */
    addMetaIcon(icon) {
        this.metaIcons.push(icon);
        this.render();
    }

    /**
     * Remove a meta icon from this TreeNode
     * @param {*} icon
     */
    removeMetaIcon(icon) {
        this.metaIcons.splice(this.metaIcons.indexOf(icon),1);
        this.render();
    }

    /**
     * Add a child node to this node at a given index
     * @param {Number} index
     * @param {TreeNode} node
     */
    addNode(node, index = -1) {
        node.parentNode = this;

        if(this.isFolded()) {
            node.html.classList.remove("mdc-list-item");
        } else {
            node.html.classList.add("mdc-list-item");
        }

        if(index === -1) {
            this.childNodes.push(node);
        } else {
            this.childNodes.splice(index, 0, node);
        }

        this.updateChildren();
    }

    /**
     * Remove a child node from this node
     * @param {TreeNode} node
     */
    removeNode(node) {
        if(this.childNodes.indexOf(node) !== -1) {
            this.childNodes.splice(this.childNodes.indexOf(node), 1);
            node.removeFromDom();
        }
    }

    /**
     * Removes all child nodes from this TreeNode
     */
    clearNodes() {
        let self = this;
        let childNodeClone = this.childNodes.slice();
        childNodeClone.forEach((child)=>{
            self.removeNode(child);
        });
    }

    /**
     * Checks if this TreeNode has any children
     * @returns {boolean} True/False depending on if this TreeNode has any children
     */
    isLeaf() {
        let visibleChildNodes = this.childNodes.filter((child)=>{
            return !child.hideSelf;
        });

        return visibleChildNodes.length === 0;
    }

    /**
     * Unfold this TreeNode
     */
    unfold() {
        if(!this.isLeaf()) {
            this.html.classList.add("tree-browser-unfolded");

            this.childNodes.forEach((child)=>{
                child.html.classList.add("mdc-list-item");
            });
        }
    }

    /**
     * Fold this TreeNode
     */
    fold() {
        if(this.alwaysOpen) {
            return;
        }

        this.html.classList.remove("tree-browser-unfolded");

        this.childNodes.forEach((child)=>{
            child.html.classList.remove("mdc-list-item");
        });
    }

    /**
     * Toggle fold state of this TreeNode
     */
    toggleFold() {
        if(this.html.classList.contains("tree-browser-unfolded")) {
            this.fold();
        } else {
            this.unfold();
        }
    }

    /**
     * Check wether this TreeNode is folded or unfolded
     * @returns {boolean} - True of this TreeNode is folded, false if unfolded
     */
    isFolded() {
        return !this.html.classList.contains("tree-browser-unfolded");
    }

    /**
     * Make this TreeNode the selected node in the tree
     */
    select() {
        let self = this;

        let treeBrowser = this.getTreeBrowser();

        if(treeBrowser != null) {
            treeBrowser.setSelected(this);
            EventSystem.triggerEvent("TreeBrowser.Selection", {
                selection: self
            });
        }
    }

    /**
     * Make this TreeNode and all parent TreeNode's unfold,
     */
    reveal() {
        this.unfold();

        if(this.parentNode != null) {
            this.parentNode.reveal();
        }
    }

    /**
     * Called when we are removed from the tree
     */
    onRemoved() {
        this.removeFromDom();
    }

    /**
     * Called when this TreeNode has been decorated
     */
    onDecorated() {
        let self = this;

        this.render();

        this.onDecoratedCallbacks.forEach((callback)=>{
            callback(self);
        });
    }

    /**
     * @private
     */
    setupContextMenu() {
        let self = this;

        if(window.MenuSystem != null) {
            this.html.addEventListener("contextmenu", (evt)=>{
                evt.preventDefault();
            });

            this.html.addEventListener("mouseup", (evt)=>{
                if(evt.button !== 2) {
                    return;
                }

                self.select();

                //Find top component after html
                let parent = self.html;
                while(parent.parentNode != null && !parent.parentNode.matches("html")) {
                    parent = parent.parentNode;
                }

                //Setup context menus
                let contextMenu = MenuSystem.MenuManager.createMenu("TreeBrowser.TreeNode.ContextMenu", {
                    context: self,
                    groupDividers: true
                });

                contextMenu.registerOnCloseCallback(()=>{
                    if(contextMenu.html.parentNode != null) {
                        contextMenu.html.parentNode.removeChild(contextMenu.html);
                    }
                });
                parent.appendChild(contextMenu.html);
                contextMenu.open({
                    x: evt.pageX,
                    y: evt.pageY
                });
                evt.stopPropagation();
                evt.preventDefault();
            });
        }
    }

    /**
     * @private
     */
    updateChildren() {
        let self = this;

        this.render();

        if(this.updateChildrenAnimFrame != null) {
            return;
        }

        this.updateChildrenAnimFrame = requestAnimationFrame(()=>{
            //Reinsert all nodes?
            self.childNodes.forEach((child)=>{
                child.insertIntoDom(self.childrenUl);
            });

            self.updateChildrenAnimFrame = null;
        });
    }

    /**
     * @private
     */
    render() {
        let self = this;

        if(this.nextAnimFrame != null) {
            //We are already scheduled to render
            return;
        }

        this.nextAnimFrame = requestAnimationFrame(()=>{
            let content = self.getProperty("content");

            let contentContainer = self.html.querySelector(":scope > .tree-browser-content");
            while(contentContainer.lastChild) contentContainer.lastChild.remove();

            if(content != null) {
                if (typeof content === "string") {
                    contentContainer.textContent = content;
                } else if (content instanceof Element) {
                    contentContainer.appendChild(content);
                } else {
                    contentContainer.textContent = "Unknown 'content' [" + (typeof content) + "]:[" + JSON.stringify(content) + "]";
                }
            }
            
            // Tooltips
            let tooltip = self.getProperty("tooltip");
            if (tooltip != null){
                self.html.setAttribute("title", tooltip);
            }

            let icon = self.getProperty("icon");

            let iconContainer = self.html.querySelector(":scope > .tree-browser-icons");

            let oldIcon = iconContainer.querySelector(".tree-browser-icon");
            if(oldIcon != null) {
                oldIcon.remove();
            }

            if(icon != null) {
                if(typeof icon === "string") {
                    //Probabely wrong!
                    let textSpan = document.createElement("span");
                    textSpan.textContent = icon;
                    icon = textSpan;
                }

                icon.classList.add("tree-browser-icon");
                iconContainer.append(icon);
            }

            ["a", "b", "c", "d"].forEach((modifierType)=>{
                //Remove old modifier
                let oldModifier = iconContainer.querySelector(".tree-browser-modifier-"+modifierType);

                if(oldModifier != null) {
                    oldModifier.remove();
                }

                let modifier = self.getProperty("modifier-"+modifierType);

                if(modifier != null) {
                    let tpl = WebstrateComponents.Tools.loadTemplate("TreeBrowser_Modifier");
                    tpl.classList.add("tree-browser-modifier-"+modifierType);

                    if(typeof modifier === "string") {
                        let textSpan = document.createElement("span");
                        textSpan.textContent = modifier;
                        modifier = textSpan;
                    }

                    tpl.appendChild(modifier);

                    iconContainer.appendChild(tpl);
                }
            });

            let metaIconContainer = self.html.querySelector(":scope > .mdc-list-item__meta");
            while(metaIconContainer.lastChild) metaIconContainer.lastChild.remove();

            self.metaIcons.forEach((icon)=>{
                metaIconContainer.appendChild(icon);
            });

            if(self.isLeaf()) {
                if(!self.html.classList.contains("tree-browser-leaf")) {
                    self.html.querySelector(".tree-browser-navigator").innerHTML = "";
                    self.html.classList.add("tree-browser-leaf");
                }

                this.fold();
            } else {
                if(self.html.classList.contains("tree-browser-leaf")) {
                    let icon = (IconRegistry.createIcon("mdc:chevron_right"));
                    self.html.querySelector(".tree-browser-navigator").appendChild(icon);
                    self.html.classList.remove("tree-browser-leaf");
                }

                if(self.alwaysOpen) {
                    self.unfold();
                }
            }

            self.nextAnimFrame = null;
        });
    }

    /**
     * @private
     */
    setupDragging() {
        let self = this;

        let uuid = UUIDGenerator.generateUUID();

        this.html.setAttribute("transient-drag-id", uuid);

        let hoverStartTime = -1;

        new CaviDraggableHTML5(this.html, {
            onDragStart: (evt)=>{
                evt.dataTransfer.setData("treenode/href", location.href);
                evt.dataTransfer.setData("treenode/uuid", uuid);
                evt.dataTransfer.setData("treenodedata/uuid|"+uuid, "");
                TreeGenerator.decorateDataTransfers(self, evt.dataTransfer);
            },
            onDragComplete: (evt)=>{
                if(evt.dataTransfer.dropEffect !== "none") {
                    EventSystem.triggerEvent("TreeBrowser.TreeNode.DragEnd", {
                        draggedNode: self,
                        dropEffect: evt.dataTransfer.dropEffect,
                        dragEvent: evt
                    });
                }
            }
        });

        new CaviDroppableHTML5(this.html, {
            onDragLeave: (evt)=>{
                hoverStartTime = -1;
                EventSystem.triggerEvent("TreeBrowser.TreeNode.DragLeave", {
                    node: self,
                    dragEvent: evt
                });
            },
            onDragOver: (evt)=>{
                evt.dataTransfer.dropEffect = "none";

                if(hoverStartTime === -1) {
                    hoverStartTime = Date.now();
                }

                let hoverTime = Date.now() - hoverStartTime;

                if(hoverTime > 1000) {
                    self.unfold();
                }

                EventSystem.triggerEvent("TreeBrowser.TreeNode.DragOver", {
                    node: self,
                    dragEvent: evt
                });
            },
            onDrop: (evt, dropEffect)=>{
                let otherWebstrate = null;

                if(evt.dataTransfer.types.includes("treenode/href")) {
                    otherWebstrate = evt.dataTransfer.getData("treenode/href");
                }

                if(evt.dataTransfer.types.includes("treenode/uuid")) {
                    try {
                        let dragUUID = evt.dataTransfer.getData("treenode/uuid");
                        let dragged = document.querySelector("[transient-drag-id='" + dragUUID + "']");
                        if (dragged != null && dragged.treeNode != null) {
                            EventSystem.triggerEvent("TreeBrowser.TreeNode.Dropped", {
                                draggedNode: dragged.treeNode,
                                droppedNode: self,
                                dropEffect: dropEffect,
                                otherWebstrate: otherWebstrate,
                                dragEvent: evt
                            });
                            return;
                        }
                    } catch(e) {
                        console.log("Error accepting drop as treenode/uuid", );
                    }
                }

                if(evt.dataTransfer.types.includes("Files")) {
                    try {
                        EventSystem.triggerEvent("TreeBrowser.Files.Dropped", {
                            files: evt.dataTransfer.files,
                            droppedNode: self,
                            otherWebstrate: otherWebstrate,
                            dragEvent: evt
                        });

                        return;
                    } catch(e) {
                        console.log("Error accepting drop as Files", e);
                    }
                }

                if(evt.dataTransfer.types.includes("treenode/asset")) {
                    try {
                        let assetUrl = evt.dataTransfer.getData("treenode/asset");
                        EventSystem.triggerEvent("TreeBrowser.Asset.Dropped", {
                            assetUrl: assetUrl,
                            droppedNode: self,
                            otherWebstrate: otherWebstrate,
                            dragEvent: evt
                        });

                        return;
                    } catch(e) {
                        console.log("Error accepting drop as Asset", e);
                    }
                }

                if(evt.dataTransfer.types.includes("text/plain")) {
                    try {
                        let text = evt.dataTransfer.getData("text/plain");

                        let tpl = document.createElement("template");
                        tpl.innerHTML = text;

                        WPMv2.stripProtection(tpl.content);

                        EventSystem.triggerEvent("TreeBrowser.DomFragment.Dropped", {
                            fragment: tpl.content,
                            droppedNode: self,
                            otherWebstrate: otherWebstrate,
                            dragEvent: evt
                        });

                        return;
                    } catch(e) {
                        console.log("Error accepting drop as text/plain", e);
                    }
                }

                console.log("No supported data transfers:", evt.dataTransfer.types.slice());

                evt.dataTransfer.types.forEach((type)=>{
                    console.log(type, evt.dataTransfer.getData(type));
                });
            }
        });
    }

    /**
     * @private
     */
    setupClickListeners() {
        let self = this;
        this.html.addEventListener("dblclick", ()=>{
            self.triggerAction();
        });
    }

    /**
     * Trigger the action listeners of this TreeNode
     */
    triggerAction() {
        let preventDefault = EventSystem.triggerEvent("TreeBrowser.TreeNode.Action", {
            node: this,
            treeBrowser: this.getTreeBrowser()
        });

        if(!preventDefault && !this.alwaysOpen) {
            this.toggleFold();
        }
    }

    registerOnDecoratedCallback(callback) {
        this.onDecoratedCallbacks.add(callback);
    }

    deregisterOnDecoratedCallback(callback) {
        this.onDecoratedCallbacks.delete(callback);
    }

    setupMetaMenu() {
        this.metaMenu = MenuSystem.MenuManager.createMenu("TreeBrowser.TreeNode.MetaMenu", {
            context: this.context,
            keepOpen: true,
            layoutDirection: MenuSystem.Menu.LayoutDirection.HORIZONTAL,
            layoutWrapping: false,
            layoutCompact: true,
            defaultFocusState: mdc.menu.DefaultFocusState.NONE
        });

        this.addMetaIcon(this.metaMenu.html);
    }
}

window.TreeNode = TreeNode;
