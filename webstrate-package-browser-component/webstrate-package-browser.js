/**
 *  Package Browser
 *  Visual browser for installing WPM packages into a Webstrate
 * 
 *  Copyright 2021 Janus B. Kristensen, CAVI,
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
    
window.WPMPackageBrowser = class WPMPackageBrowser {
    constructor(autoOpen=true) {
        let self = this;

        this.itemTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserPackageItem");
        this.html = WebstrateComponents.Tools.loadTemplate("#packageBrowserBase");
        this.mainView = self.html.querySelector("#packageBrowserMain");
        
        wpm.require(["material-design-components", "material-design-icons"]).then(()=>{
            mdc.autoInit(self.html);
            let tabs = self.html.querySelector(".mdc-tab-bar").MDCTabBar;
            
            tabs.listen("MDCTabBar:activated", (evt)=> {
                // Switch tabs
                switch (evt.detail.index){
                    case 0:
                        self.showRepositories();
                        break;
                    default:
                        self.showSystem();
                }
            });
            
            try {
                if (!self.getBootConfig()){
                    // We assume that we may create a new empty boot config if it doesn't exist
                    let bootConfig = {
                        creator: "WPMPackageManager",
                        created: Date.now(),
                        require: []
                    };

                    self.setBootConfig(bootConfig);
                }
                tabs.activateTab(0); //self.showInstalled();
            } catch (ex){
                tabs.activateTab(1); //self.showSystem();
            }            
        });
        
        if (autoOpen) this.openInBody();
    }
    
    openInBody(){
        let parent = document.createElement("transient");
        parent.appendChild(this.html);
        document.body.appendChild(parent);
    }

    showInstalled() {
        let self = this;
        this.mainView.innerHTML="";
        
        
        let installedView = WebstrateComponents.Tools.loadTemplate("#packageBrowserPackageList");
        this.mainView.appendChild(installedView);
    }
    
    showRepositories() {
        let self = this;
        this.mainView.innerHTML="";
        
        let repositoryView = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryList");
        
        // Gather a list of used repositories, both site-wide from WPM and previously added from this browser
        let knownRepositories = [];
        let installedPackages = WPMv2.getCurrentlyInstalledPackages();
        for (let packageInfo of installedPackages){
            if (packageInfo.repository && !knownRepositories.includes(packageInfo.repository)){
                knownRepositories.push(packageInfo.repository);
            }
        }        
        let bootConfig = this.getBootConfig();
        if (bootConfig.knownRepositories && Array.isArray(bootConfig.knownRepositories)){
            for (let repoURL of bootConfig.knownRepositories){
                if (!knownRepositories.includes(repoURL)){
                    knownRepositories.push(repoURL);
                }
            }
        }
        
        // Sort it and show it
        let sortedRepositories = knownRepositories.sort();        
        let repoListDiv = repositoryView.querySelector(".repository-list");
        for (let repositoryURL of sortedRepositories){
            let repositoryHeaderTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryItem_header");            
            let repositoryRepositoryTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryItem_repository");            
            let repositoryBodyTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryItem_body");            
            repositoryHeaderTemplate.querySelector(".repository-url").innerText = repositoryURL;
            
            // Delayed-load up-to-date packages list
            setTimeout(async ()=>{
                let repositoryPackages = await WPMv2.getPackagesFromRepository(repositoryURL);
                
                let renderBody = ()=>{
                    for (let packageInfo of repositoryPackages){
                        repositoryBodyTemplate.appendChild(self.renderPackageItem(packageInfo, bootConfig));
                    }                
                };
                await renderBody();
                
                // Repository-wide override buttons
                repositoryRepositoryTemplate.querySelector(".repository-require input").checked = self.isConfigDirectlyRequiringRepository(bootConfig, repositoryURL);
                repositoryRepositoryTemplate.querySelector(".repository-require input").addEventListener("click", async (evt)=>{
                    // Enabled repository-wide require option, remove any per-package settings from bootConfig
                    for (let packageInfo of repositoryPackages){
                        await self.removePackageRequire(packageInfo);
                    }
                    
                    if (evt.target.checked){
                        await self.addRepositoryRequire(repositoryURL);
                    } else {                       
                        await self.removeRepositoryRequire(repositoryURL);
                    }
                    
                    bootConfig = this.getBootConfig();
                    repositoryBodyTemplate.innerHTML = "";
                    await renderBody();
                });
                
            },0);
                       
            repoListDiv.appendChild(repositoryHeaderTemplate);
            repoListDiv.appendChild(repositoryRepositoryTemplate);
            repoListDiv.appendChild(repositoryBodyTemplate);
            
            
        }
        
        this.mainView.appendChild(repositoryView);        
    }
    
    showSystem(){
        let self = this;
        this.mainView.innerHTML="";        
        
        let systemView = WebstrateComponents.Tools.loadTemplate("#packageBrowserSystem");
        this.mainView.appendChild(systemView);
        let wpmInfo = systemView.querySelector("#wpm-info");                
        let bootLoaderInfo = systemView.querySelector("#bootloader-info");        
        let bootLoaderConfig = systemView.querySelector("#bootloader-config");        
        
        // Package Manager
        if (WPMv2){
            wpmInfo.querySelector(".name").innerText = "WPMv2";            
            if (WPMv2.version){ 
                wpmInfo.querySelector(".version").innerText = WPMv2.version;
                wpmInfo.querySelector(".wpm-version-warning").remove();
            }
            if (WPMv2.revision){
                wpmInfo.querySelector(".revision").innerText = WPMv2.revision;
            }
            
            wpmInfo.querySelector(".update").addEventListener("click", async ()=>{
                // STUB: Maybe make this fancier with custom URLs and showing new version before updating etc
                let oldVersion = WPMv2.version;
                await WPMv2.updateWPM("/wpm/?raw");
                let newVersion = WPMv2.version;

                if(oldVersion !== newVersion) {
                    console.log("WPM was updated, reloading...")
                    setTimeout(()=>{
                        location.reload();
                    }, 1000);
                }
            });
        }
        
        // Config
        
    }

    
    getBootConfig(){
        let element = document.querySelector("script[type='text/json+bootconfig']");
        if (!element) return false;
        
        let j = JSON.parse(element.textContent);
        return j;
    }    
    
    setBootConfig(config){
        let element = document.querySelector("script[type='text/json+bootconfig']");
        if (!element) {
            element = document.createElement("script");
            element.setAttribute("type", "text/json+bootconfig");
            WPMv2.stripProtection(element);
            document.head.appendChild(element);
            console.warn("Installing new boot config");
        }
        
        config["updated"] = Date.now();
        element.textContent = JSON.stringify(config, null, 4);
    }    
    
    isConfigDirectlyRequiringPackage(config, name){
        if (!config) throw new Error("Boot config is undefined");
        if (!config.require) throw new Error("Boot config does not contain require");
        if (!Array.isArray(config.require)) throw new Error("Boot config require is not an array");
        
        for (let requireStep of config.require){
            if (!requireStep.dependencies) continue;
            if (!Array.isArray(requireStep.dependencies)) continue;
            for (let dependency of requireStep.dependencies){
                if (dependency.package && dependency.package===name){
                    return true;
                }
            }
        }
        return false;
    }
    
    isConfigDirectlyRequiringRepository(config, name){
        if (!config) throw new Error("Boot config is undefined");
        if (!config.require) throw new Error("Boot config does not contain require");
        if (!Array.isArray(config.require)) throw new Error("Boot config require is not an array");
        
        for (let requireStep of config.require){
            if (!requireStep.dependencies) continue;
            if (!Array.isArray(requireStep.dependencies)) continue;
            for (let dependency of requireStep.dependencies){
                if (dependency.repository && dependency.repository===name && !dependency.package){
                    return true;
                }
            }
        }
        return false;
    }
        
    
    
    getLocalPackageElement(packageName){
        return document.querySelector(".packages .package#" + packageName + ", wpm-package#" + packageName);
    }
    
    isTransientPackageElement(packageElement){
        if (typeof webstrate !== "undefined"){
            // In webstrate mode webstrates defines what is transient
            if (webstrate.config.isTransientElement(packageElement)) return true;
        } else {
            // Otherwise we assume a transient tag is used to mark it
            if (packageElement.toLowerCase()==="transient") return true;
        }
        let parent = packageElement.parentElement;
        if (parent){
            return this.isTransientPackageElement(parent);
        } else {
            return false;
        }
    }
    
    isForcedEmbeddedPackage(packageInfo){     
        if (packageInfo.descriptor){
            if (packageInfo.descriptor.forceEmbedding) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Adds a package to the boot config and installs it
     * 
     * @param {type} packageInfo
     * @param {type} step
     * @returns {undefined}
     */
    async addPackageRequire(packageInfo, step=-1){        
        let config = this.getBootConfig();
        
        if (step===-1 || step > config.require.length){
            step = config.require.length-1;
        }
        if (step===-1){
            config.require.push({dependencies:[], options:{}});
            step = 0;
        }
        
        // Add it and load it
        let packageRequire = {package:packageInfo.name, repository:packageInfo.repository};
        await wpm.require(packageRequire); // also install it right away
        config.require[step].dependencies.push(packageRequire);        
        this.setBootConfig(config);
    }
    
    async removePackageRequire(packageInfo){
        let config = this.getBootConfig();
        
        let removedIt = false;
        for (let requireStep of config.require){
            if (!requireStep.dependencies) continue;
            if (!Array.isArray(requireStep.dependencies)) continue;
            
            let newDependencies = [];
            for (let dependency of requireStep.dependencies){
                if (dependency.package && dependency.package===packageInfo.name){
                    removedIt = true;
                } else {
                    newDependencies.push(dependency);
                }
            }
            requireStep.dependencies = newDependencies;
        }
        
        if (removedIt){
            // TODO: Figure out if something else also depends on it
            // If not, figure out if the package repository is this page
            // If not, remove it from runtime too
        }
        
        this.setBootConfig(config);        
    }    
    
    async removeRepositoryRequire(repositoryURL){
        let config = this.getBootConfig();
        
        let removedIt = false;
        for (let requireStep of config.require){
            if (!requireStep.dependencies) continue;
            if (!Array.isArray(requireStep.dependencies)) continue;
            
            let newDependencies = [];
            for (let dependency of requireStep.dependencies){
                if (dependency.repository && dependency.repository===repositoryURL && !dependency.package){
                    removedIt = true;
                } else {
                    newDependencies.push(dependency);
                }
            }
            requireStep.dependencies = newDependencies;
        }
        
        if (removedIt){
            // TODO: Figure out if something else also depends on it
            // If not, remove it from runtime too
        }
        
        this.setBootConfig(config);        
    }      
    
    /**
     * Adds a package to the boot config and installs it
     * 
     * @param {type} repositoryURL
     * @param {type} step
     * @returns {undefined}
     */
    async addRepositoryRequire(repositoryURL, step=-1){        
        let config = this.getBootConfig();
        
        if (step===-1 || step > config.require.length){
            step = config.require.length-1;
        }
        if (step===-1){
            config.require.push({dependencies:[], options:{}});
            step = 0;
        }
        
        // Add it and load it
        let repositoryRequire = {repository:repositoryURL};
        await wpm.require(repositoryRequire); // also install it right away
        config.require[step].dependencies.push(repositoryRequire);        
        this.setBootConfig(config);
    }    
    
    renderPackageItem(wpmPackage, bootConfig){
        let self = this;
       
        let packageItemTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserPackageItem");
      
        if (!wpmPackage.name){            
            return WebstrateComponents.Tools.loadTemplate("#packageBrowserPackageItemError");            
        }
        packageItemTemplate.querySelector(".package-name").innerText = wpmPackage.name;
        
        ["version", "description", "license"].forEach((packageProperty)=>{
            if (wpmPackage[packageProperty]) packageItemTemplate.querySelector(".package-"+packageProperty).innerText = wpmPackage[packageProperty];
        });
        
        let localPackageElement = this.getLocalPackageElement(wpmPackage.name);
        if (localPackageElement) {           
            // Check if required directly or because of dependency/system            
            if (this.isConfigDirectlyRequiringPackage(bootConfig, wpmPackage.name)){
                packageItemTemplate.querySelector(".package-required input").checked = true;
            } else {
                packageItemTemplate.querySelector(".package-required").setAttribute("data-indirect-requirement","true");
                packageItemTemplate.querySelector(".package-required .mdc-checkbox").setAttribute("title", "Indirectly required by another package at runtime");
                
                try {
                    // Add which package pulled this in
                    let pulledInBy = [];
                    WPMv2.getCurrentlyInstalledPackages().forEach(function(pkg){
                        pkg.dependencies.forEach(function(dep){
                            if (typeof dep === "string" && dep.indexOf("#"+wpmPackage.name)!=-1){
                                pulledInBy.push(pkg);
                            }
                        });
                    });
                    if (pulledInBy.length > 0){
                        packageItemTemplate.querySelector(".package-required .mdc-checkbox").setAttribute("title", "Indirectly required by "+pulledInBy);
                    }
                } catch (ex){
                    console.warn(ex);
                }
            }

            // Embedding status
            packageItemTemplate.querySelector(".package-embedded input").checked = !this.isTransientPackageElement(localPackageElement);
            if (this.isForcedEmbeddedPackage(wpmPackage)){
                packageItemTemplate.querySelector(".package-embedded input").setAttribute("title", "This package wants to be embedded when installed");
            }
        }
        
        let embed = async function embed(){
            // Embed this package                
            if (localPackageElement && self.isTransientPackageElement(localPackageElement)){
                // Already installed transiently, remove first
                localPackageElement.remove();
                //Also remove wpm transient element if found
                document.querySelector("[transient-wpmid='"+wpmPackage.name+"']")?.remove();
            };

            let packageRequire = {package:wpmPackage.name, repository:wpmPackage.repository, appendTarget:"head"};
            await wpm.require(packageRequire); // install it right away
            localPackageElement = self.getLocalPackageElement(wpmPackage.name); // update the package element  
            packageItemTemplate.querySelector(".package-embedded input").checked = true;
        }
        
        let unEmbed = async function unEmbed(){
            localPackageElement.remove();

            if (self.isConfigDirectlyRequiringPackage(bootConfig, wpmPackage.name)){
                // Re-install transiently if required
                await wpm.require(wpmPackage);
                localPackageElement = self.getLocalPackageElement(wpmPackage.name); // update the package element
            };            
            packageItemTemplate.querySelector(".package-embedded input").checked = false;
        }
        
        // Click handlers
        packageItemTemplate.querySelector(".package-required input").addEventListener("click", async (box)=>{
            if (box.target.checked){ 
                // Require a package
                if (self.isForcedEmbeddedPackage(wpmPackage) && !packageItemTemplate.querySelector(".package-embedded input").checked){
                    await embed();
                }

                await self.addPackageRequire(wpmPackage);
            } else {
                if (self.isForcedEmbeddedPackage(wpmPackage) && packageItemTemplate.querySelector(".package-embedded input").checked){
                    await unEmbed();
                }

                // Remove require for a package
                await self.removePackageRequire(wpmPackage);
                packageItemTemplate.querySelector(".package-embedded input").checked = false;
            }
        });
        
        packageItemTemplate.querySelector(".package-embedded input").addEventListener("click",async (box)=>{
            if (box.target.checked){
                await embed();
            } else {
                await unEmbed();
            }   
        });
        
        
        // Check repository includes
        if (wpmPackage.repository && self.isConfigDirectlyRequiringRepository(bootConfig, wpmPackage.repository)){
            packageItemTemplate.querySelector(".package-required input").disabled = true;
            packageItemTemplate.querySelector(".package-required input").checked = true;
            packageItemTemplate.querySelector(".package-embedded input").disabled = true;
        }
        
        return packageItemTemplate;
    }
};
