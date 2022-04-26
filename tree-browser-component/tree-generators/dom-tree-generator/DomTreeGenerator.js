/**
 *  DOM Tree Generator
 *  Generates trees based on DOM nodes
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

/* global webstrate */

/**
 * @typedef {Object} DomTreeGenerator~config
 * @property {String[]} [includeRules] - An array of CSS selectors that represents what should be included even if excluded or transient. If empty, everything that is not excluded will be included.
 * @property {String[]} [excludeRules] - An array of CSS selectors that represents what should be excluded.
 * @property {boolean} [includeWebstrateTransients=false] - Should webstrate transient elements be included true/false
 * @property {boolean} [live=true] - Is the Tree live, ie. does changes to the dom reflect in the tree.
 */

/**
 * DomTreeGenerator can traverse DOM and generate TreeNode trees from the visited DOM Nodes
 */
class DomTreeGenerator extends TreeGenerator {
    /**
     * Create a new DomTreeGenerator with the given configuration
     * @param {DomTreeGenerator~config}config
     */
    constructor(config) {
        super();

        this.excludeRules = WebstrateComponents.Tools.fromConfig(config, "excludeRules", []);
        this.includeRules = WebstrateComponents.Tools.fromConfig(config, "includeRules", []);

        //Hardcode that .tree-browser is not observed, could lead to nasty infinite loops if not?
        if(this.excludeRules.indexOf(".tree-browser") === -1) {
            this.excludeRules.push(".tree-browser");
        }

        this.includeWebstrateTransients = WebstrateComponents.Tools.fromConfig(config, "includeWebstrateTransients", false);

        this.live = WebstrateComponents.Tools.fromConfig(config, "live", true);

        if(this.live) {
            this.setupObserver();
        }
    }

    /**
     * Start generation of a tree
     * @param {Element} root - The element to use as the root for this tree
     * @returns {TreeNode}
     */
    generateTree(root) {
        let self = this;

        let node = new TreeNode({
            type: "DomTreeNode",
            context: root
        });

        this.saveTreeNode(node);

        TreeGenerator.decorateNode(node);

        Array.from(root.children).forEach((child)=>{
            if(self.shouldInclude(child)) {
                let childNode = self.generateTree(child);
                node.addNode(childNode, self.findChildIndex(child));
            }
        });

        return node;
    }

    /**
     * Checks if the given HTML element should be included in the tree
     * @param {Element} node
     * @returns {boolean}
     * @private
     */
    shouldInclude(node) {
        for(let includeRule of this.includeRules) {
            if(node.matches(includeRule)) {
                return true;
            }
        }

        for(let excludeRule of this.excludeRules) {
            if(node.matches(excludeRule)) {
                return false;
            }
        }

        if((typeof webstrate !== "undefined") && !this.includeWebstrateTransients) {
            if(webstrate.config.isTransientElement(node)) {
                return false;
            }
        }

        if(this.includeRules.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns the child index the given node has in its parents children NodeList
     * @param {Element} node
     * @returns {number}
     * @private
     */
    findChildIndex(node) {
        let parent = node.parentNode;

        if(parent != null) {
            let i = 0;
            for(let child of parent.children) {
                if(this.shouldInclude(child)) {
                    if(child === node) {
                        return i;
                    }

                    i++;
                }
            }
        }

        return -1;
    }

    /**
     * Setup the Live observer
     * @private
     */
    setupObserver() {
        let self = this;

        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                let targetTreeNode = self.lookupTreeNode(mutation.target);

                mutation.removedNodes.forEach((removedNode) => {
                    if(removedNode instanceof Element) {
                        //Removed node
                        let removedTreeNode = self.lookupTreeNode(removedNode);
                        if (removedTreeNode != null) {
                            self.deleteTreeNode(removedTreeNode);
                            removedTreeNode.onRemoved();
                            if (targetTreeNode != null) {
                                targetTreeNode.removeNode(removedTreeNode);
                            }
                        }
                    }
                });
                mutation.addedNodes.forEach((addedNode) => {
                    if(addedNode instanceof Element) {
                        if (targetTreeNode != null) {
                            if (self.shouldInclude(addedNode)) {
                                //Check if node is already added to the tree
                                if(self.lookupTreeNode(addedNode) == null) {
                                    //Added children to a treeNode
                                    let addedTreeNode = self.generateTree(addedNode);
                                    targetTreeNode.addNode(addedTreeNode, self.findChildIndex(addedNode));
                                }
                            }
                        }
                    }
                });

                if(targetTreeNode != null) {
                    TreeGenerator.decorateNode(targetTreeNode);
                }
            });
        });

        observer.observe(document, {
            childList: true,
            attributes: true,
            subtree: true,
            characterData: true
        });
    }
}

window.DomTreeGenerator = DomTreeGenerator;