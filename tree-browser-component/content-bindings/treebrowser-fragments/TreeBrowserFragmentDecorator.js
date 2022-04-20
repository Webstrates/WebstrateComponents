/**
 *  Fragment Decorator
 *  Decorates Codestrate Fragments in a tree
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
 * Decorator that decorates Codestrate fragments
 */
class TreeBrowserFragmentDecorator {
    /**
     * Attempts to decorate the given TreeNode
     * @param {TreeNode} node - The node to decorate
     * @returns {boolean} True/False depending on if the node was decorated
     */
    static decorate(node) {
        if(node.type === "DomTreeNode") {
            if(node.context.matches("code-fragment")) {
                let content = "";
                let name = node.context.getAttribute("name");
                if (name != null && name != ""){
                    content = name+" ";
                }
                if(node.context.id != null && node.context.id!="") {
                    content += "#"+node.context.id;
                }
                if (!content){
                    content = node.context.tagName.toLowerCase();

                    if(typeof cQuery !== "undefined") {
                        let fragment = cQuery(node.context).data("Fragment");

                        if(fragment != null) {
                            content = fragment.constructor.name;
                        }
                    }
                }
                let type = node.context.getAttribute("data-type");

                // Find a proper icon either from an icon provider or a default one
                node.setProperty("icon", IconRegistry.createIcon(["code-fragment:"+type, "mdc:insert_drive_file"]));
                node.setProperty("content", content);
                node.setProperty("tooltip", node.context.tagName.toLowerCase()+" ("+type+")");

                if(node.context.getAttribute("auto") != null) {
                    node.setProperty("modifier-a", IconRegistry.createIcon(["A", "mdc:play_circle_outline"]));
                } else {
                    node.setProperty("modifier-a", null);
                }

                return true;
            }
        }

        return false;
    }
}

window.TreeBrowserFragmentDecorator = TreeBrowserFragmentDecorator;

TreeGenerator.registerDecorator(TreeBrowserFragmentDecorator, 10);