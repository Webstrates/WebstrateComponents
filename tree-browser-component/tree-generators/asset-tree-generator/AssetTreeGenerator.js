/**
 *  Asset Tree Generator
 *  Generates trees based on assets uploaded to a Webstrate
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
    
class AssetTreeGenerator extends TreeGenerator {
    constructor(config) {
        super();

        this.live = WebstrateComponents.Tools.fromConfig(config, "live", true);

        if(this.live) {
            this.setupObserver();
        }

        this.rootNode = null;
    }

    generateTree() {
        let self = this;

        this.rootNode = new TreeNode({
            type: "AssetRootNode",
            context: null
        });
        if(webstrate != null && webstrate.assets && webstrate.assets.forEach!=null) {

            let filteredAssets = new Map();

            webstrate.assets.forEach((asset)=>{
                if(filteredAssets.has(asset.fileName)) {
                    let oldAsset = filteredAssets.get(asset.fileName);

                    if(asset.v > oldAsset.v) {
                        filteredAssets.set(asset.fileName, asset);
                    }
                } else {
                    filteredAssets.set(asset.fileName, asset);
                }
            });

            let sortedArray = Array.from(filteredAssets.values()).sort((a1, a2)=>{
                return a1.fileName.localeCompare(a2.fileName);
            });

            sortedArray.forEach((asset)=>{
                if(asset.deletedAt != null) {
                    //Deleted asset, skip
                    return;
                }

                let treeNode = AssetTreeGenerator.createNodeFromAsset(asset);

                self.rootNode.addNode(treeNode, self.findAssetIndex(asset));

                self.saveTreeNode(treeNode);
            });
        }

        TreeGenerator.decorateNode(this.rootNode);

        return this.rootNode;
    }

    /**
     * Create a TreeNode from an asset json
     * @param {JSON} asset
     * @returns {TreeNode}
     * @private
     */
    static createNodeFromAsset(asset) {
        let assetNode = null;
        if (asset.fileName.endsWith(".zip")){
            assetNode = new TreeNode({
                lookupKey: asset.fileName,
                context: asset,
                type: "AssetContainer"
            });
            
            // Explore the first zip level
            AssetTreeGenerator.exploreZipLevel(assetNode);
        } else {
            assetNode = new TreeNode({
                lookupKey: asset.fileName,
                context: asset,
                type: "AssetNode"
            });
        }

        TreeGenerator.decorateNode(assetNode);

        return assetNode;
    }

    /**
     * Finds an asset with the given name
     * @param {string} assetName
     * @returns {JSON} - The found asset
     */
    static findAssetFromName(assetName) {
        let filteredAssets = new Map();
        if (webstrate && webstrate.assets && webstrate.assets.forEach){
            webstrate.assets.forEach((asset)=>{
                if(filteredAssets.has(asset.fileName)) {
                    let oldAsset = filteredAssets.get(asset.fileName);

                    if(asset.v > oldAsset.v) {
                        filteredAssets.set(asset.fileName, asset);
                    }
                } else {
                    filteredAssets.set(asset.fileName, asset);
                }
            });
            return filteredAssets.get(assetName);
        } else {
            return null;
        }

    }

    /**
     * Returns the index of this asset
     * @param {JSON} asset
     * @returns {number}
     * @private
     */
    findAssetIndex(asset) {
        let filteredAssets = new Map();

        webstrate.assets.forEach((asset)=>{
            if(filteredAssets.has(asset.fileName)) {
                let oldAsset = filteredAssets.get(asset.fileName);

                if(asset.v > oldAsset.v) {
                    filteredAssets.set(asset.fileName, asset);
                }
            } else {
                filteredAssets.set(asset.fileName, asset);
            }
        });

        let sortedArray = Array.from(filteredAssets.keys()).sort((a1, a2)=>{
            return a1.localeCompare(a2);
        });

        return sortedArray.indexOf(asset.fileName);
    }

    setupObserver() {
        let self = this;

        if(webstrate != null) {
            webstrate.on("asset", (asset)=>{
                console.log("Asset event:", asset);

                let oldTreeNode = self.lookupTreeNode(asset.fileName);

                if(oldTreeNode == null) {
                    //New asset, just add
                    self.rootNode.addNode(AssetTreeGenerator.createNodeFromAsset(asset), self.findAssetIndex(asset));
                } else {
                    //Already existed, update context and redocorate
                    oldTreeNode.context = asset;
                    TreeGenerator.decorateNode(oldTreeNode);
                }
            });
        }
    }
    
    static exploreZipLevel(assetNode){
        // TODO: For now it explores the entire zip
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', assetNode.context.fileName+"/?dir", true);
        xhr.responseType = 'json';
        xhr.onload = function() {
            var status = xhr.status;
            if (status === 200) {
                xhr.response.forEach((entry)=>{
                    if (!entry.endsWith("/")){
                        let node = new TreeNode({
                            lookupKey: assetNode.context.fileName,
                            context: {
                                fileName: assetNode.context.fileName+"/"+entry,
                                v: 0
                            },                        
                            type: "AssetNode"
                        });
                        TreeGenerator.decorateNode(node);
                        assetNode.addNode(node);
                    }
                });
            } else {
                console.log("Couldn't unzip zip");
            }
        };
        xhr.send();
    }
}

window.AssetTreeGenerator = AssetTreeGenerator;