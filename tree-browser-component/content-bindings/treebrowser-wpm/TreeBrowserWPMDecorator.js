/**
 *  WPM Decorator
 *  Handles decoration of WPM package nodes in a tree
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
 * Decorator that decorates HTML elements
 */
class TreeBrowserWPMDecorator {
    /**
     * Attempts to decorate the given TreeNode
     * @param {TreeNode} node - The node to decorate
     * @returns {boolean} True/False depending on if the node was decorated
     */
    static decorate(node) {
        if(node.type === "DomTreeNode" && node.context.matches("wpm-package")) {
            let id = (node.context.id!=null && node.context.id.trim().length > 0)?" #"+node.context.id:"";
            node.setProperty("content", node.context.tagName.toLowerCase() + id);
            
            // TODO: add disabled/live state to classes

            let assetRootNode = node.assetRootNode;

            node.childNodes.forEach((child)=>{
                if(child.type === "AssetRootNode") {
                    assetRootNode = child;
                }
            });

            let descriptor = node.context.querySelector("code-fragment[data-type='wpm/descriptor']");

            if(descriptor != null && typeof cQuery !== "undefined") {
                let descFrag = cQuery(descriptor).data("Fragment");

                if(descFrag != null) {

                    if(assetRootNode == null) {
                        assetRootNode = new TreeNode({
                            type: "AssetRootNode"
                        });
                        TreeGenerator.decorateNode(assetRootNode);

                        node.assetRootNode = assetRootNode;

                        //Setup event to look for asset updates

                        let self = this;

                        if(webstrate != null) {
                            webstrate.on("asset", (asset)=>{
                                updateAssets();
                            });
                        }

                        function updateAssets() {
                            if(assetRootNode != null && descFrag != null) {
                                assetRootNode.clearNodes();

                                descFrag.require().then((descJson) => {
                                    descJson.assets.forEach((assetJson) => {
                                        if (typeof assetJson === "string") {
                                            let asset = AssetTreeGenerator.findAssetFromName(assetJson);
                                            if (asset != null) {
                                                let assetNode = AssetTreeGenerator.createNodeFromAsset(asset);
                                                assetRootNode.addNode(assetNode);
                                            }
                                        }
                                    });

                                    if (assetRootNode.isLeaf()) {
                                        node.removeNode(assetRootNode);
                                    } else {
                                        node.addNode(assetRootNode, 9999);
                                        assetRootNode.render();
                                    }
                                });
                            }
                        }

                        descFrag.registerOnFragmentChangedHandler(()=>{
                            updateAssets();
                        });

                        updateAssets();
                    }
                }
            } else {
                if(assetRootNode != null) {
                    node.removeNode(assetRootNode);
                    node.assetRootNode = null;
                    assetRootNode = null;
                }
            }

            // Set open/closed icons in the default case
            let iconNode = document.createElement("span");
            iconNode.classList.add("tree-browser-custom-icon");

            let icon = IconRegistry.createIcon(["webstrates:wpm-package-closed", "mdc:insert_drive_file"]);
            icon.classList.add("tree-browser-icon-closed");
            iconNode.appendChild(icon);
            icon = IconRegistry.createIcon(["webstrates:wpm-package-open", "mdc:insert_drive_file"]);
            icon.classList.add("tree-browser-icon-unfolded");
            iconNode.appendChild(icon);

            node.setProperty("icon", iconNode);            
            return true;
        }

        //Hide wpm-descriptor inside descriptor code-fragment
        if(node.type === "DomTreeNode" && node.context.matches("wpm-descriptor")) {
            if(node.context.parentNode != null && node.context.parentNode.matches("code-fragment[data-type='wpm/descriptor']")) {
                node.hideSelf = true;
            }
        }

        return false;
    }
}

window.TreeBrowserWPMDecorator = TreeBrowserWPMDecorator;

TreeGenerator.registerDecorator(TreeBrowserWPMDecorator, 10);