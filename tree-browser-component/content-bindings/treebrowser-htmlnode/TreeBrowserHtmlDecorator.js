/**
 *  HTML Decorator
 *  Decorates HTML nodes in a tree
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
class TreeBrowserHtmlDecorator {
    /**
     * Attempts to decorate the given TreeNode
     * @param {TreeNode} node - The node to decorate
     * @returns {boolean} True/False depending on if the node was decorated
     */
    static decorate(node) {
        if(node.type === "DomTreeNode") {

            let id = (node.context.id!=null && node.context.id.trim().length > 0)?" #"+node.context.id:"";
            let name = (node.context.getAttribute("name")!=null && node.context.getAttribute("name").trim().length > 0)?" "+node.context.getAttribute("name"):"";

            node.setProperty("content", node.context.tagName.toLowerCase()+id+name);
            
            let icon = null;      
            switch (node.context.tagName.toLowerCase()){
                case "script":
                    icon = "mdc:code";
                    break;
            }
            if (icon){
                node.setProperty("icon", IconRegistry.createIcon(icon));
            } else {
                // Set open/closed icons in the default case
                let iconNode = document.createElement("span");
                let closedNode = IconRegistry.createIcon("mdc:folder");
                closedNode.classList.add("tree-browser-icon-closed");
                iconNode.appendChild(closedNode);
                let unfoldedNode = IconRegistry.createIcon("mdc:folder_open");
                unfoldedNode.classList.add("tree-browser-icon-unfolded");
                iconNode.appendChild(unfoldedNode);                
                node.setProperty("icon", iconNode);
            }
            
            return true;
        }

        return false;
    }

    /**
     * Attempts to decorate the given DataTransfer based on the given TreeNode
     * @param {TreeNode} node
     * @param {DataTransfer} dataTransfer
     * @returns {boolean} True/False depending on if the DataTransfer was decorated
     */
    static decorateDataTransfer(node, dataTransfer) {
        if(node.type === "DomTreeNode") {
            dataTransfer.setData("text/plain", node.context.outerHTML);

            return true;
        }

        return false;
    }
}

window.TreeBrowserHtmlDecorator = TreeBrowserHtmlDecorator;

TreeGenerator.registerDecorator(TreeBrowserHtmlDecorator, 0);