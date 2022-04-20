/**
 *  TreeGenerator
 *  Superclass for generators of trees
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
 * A generator that builds trees from some context
 * @abstract
 */
class TreeGenerator {
    /**
     * Create a new TreeGenerator
     */
    constructor() {
        this.treeNodeLookup = new Map();
    }

    /**
     * Lookup the TreeNode associated with lookupKey
     * @param {*} lookupKey
     * @returns {TreeNode} The found TreeNode or null if no TreeNode could be found
     * @protected
     */
    lookupTreeNode(lookupKey) {
        return this.treeNodeLookup.get(lookupKey);
    }

    /**
     * Save the reference from lookupKey to TreeNode
     * @param {TreeNode} node - The TreeNode to save
     * @protected
     */
    saveTreeNode(node) {
        this.treeNodeLookup.set(node.lookupKey, node);
    }

    /**
     * Remove the reference from lookupKey to TreeNode
     * @param {TreeNode} node
     * @protected
     */
    deleteTreeNode(node) {
        let self = this;

        this.treeNodeLookup.delete(node.lookupKey);

        node.childNodes.forEach((child)=>{
            self.deleteTreeNode((child));
        });
    }

    /**
     * Runs through all registered decorators and tries to decorate the given node, the first decorator to do something wins.
     * @param {TreeNode} node - The TreeNode to decorate
     * @protected
     */
    static decorateNode(node) {
        for(let decorator of TreeGenerator.decorators) {
            if(typeof decorator.decorator.decorate === "function" && decorator.decorator.decorate(node)) {
                //First decorator that decorates our node, wins!
                node.onDecorated();
                break;
            }
        }
    }

    /**
     * Runs through all registered decorators and gives them a chance to add DataFlavors to the given dnd DataTransfer
     * @param {TreeNode} node
     * @param {DataTransfer} dataTransfer
     */
    static decorateDataTransfers(node, dataTransfer) {
        for(let decorator of TreeGenerator.decorators) {
            if(typeof decorator.decorator.decorateDataTransfer === "function" && decorator.decorator.decorateDataTransfer(node, dataTransfer)) {
                break;
            }
        }
    }

    /**
     * Register a decorator
     * @param decorator
     * @param {Number} priority
     */
    static registerDecorator(decorator, priority) {
        TreeGenerator.decorators.push({
            decorator: decorator,
            priority: priority
        });

        //Sort decorators according to priority
        TreeGenerator.decorators.sort((i1, i2)=>{
            return i2.priority - i1.priority;
        });
    }
}

window.TreeGenerator = TreeGenerator;

TreeGenerator.decorators = [];