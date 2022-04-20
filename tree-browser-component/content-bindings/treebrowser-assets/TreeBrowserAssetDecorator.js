/**
 *  Asset Decorator
 *  Decorates Asset nodes in a tree
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
 * Decorator that decorates Assets
 */
class TreeBrowserAssetDecorator {
    /**
     * Attempts to decorate the given TreeNode
     * @param {TreeNode} node - The node to decorate
     * @returns {boolean} True/False depending on if the node was decorated
     */
    static decorate(node) {
        if(node.type === "AssetNode") {
            let version = " v"+node.context.v;
            node.setProperty("content", node.context.fileName+version);
            node.setProperty("icon", IconRegistry.createIcon("mdc:attachment"));
            return true;
        } else if(node.type === "AssetContainer") {
            let version = " v"+node.context.v;
            let iconNode = document.createElement("div");
            iconNode.classList.add("tree-browser-custom-icon");
            let icon = IconRegistry.createIcon("mdc:work_outline");
            icon.classList.add("tree-browser-icon-closed");
            iconNode.appendChild(icon);
            icon = IconRegistry.createIcon("mdc:work");
            icon.classList.add("tree-browser-icon-unfolded");
            iconNode.appendChild(icon);
            node.setProperty("content", node.context.fileName+version);
            node.setProperty("icon", iconNode);
            return true;
        } else if(node.type === "AssetRootNode") {
            node.setProperty("content", "Assets");
            node.setProperty("icon", IconRegistry.createIcon("mdc:cloud"));
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
        if(node.type === "AssetNode") {
            let uri = location.href + node.context.fileName;
            dataTransfer.setData("treenode/asset", uri);
            dataTransfer.setData("text/uri-list", uri);
            dataTransfer.setData("text/plain", uri);
            return true;
        }

        return false;
    }
}

window.TreeBrowserAssetDecorator = TreeBrowserAssetDecorator;

TreeGenerator.registerDecorator(TreeBrowserAssetDecorator, 10);