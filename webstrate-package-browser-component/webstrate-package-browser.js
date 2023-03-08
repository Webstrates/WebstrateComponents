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
        self.topLevelComponent = document.documentElement;
        
        self.itemTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserPackageItem");
        self.html = WebstrateComponents.Tools.loadTemplate("#packageBrowserBase");
        self.mainView = self.html.querySelector("#packageBrowserMain");
        
        wpm.require(["material-design-components", "material-design-icons","ModalDialog","MenuSystem","MaterialMenu","MaterialDesignOutlinedIcons"]).then(()=>{
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
                tabs.activateTab(0); //self.showRepositories();
            } catch (ex){
                tabs.activateTab(1); //self.showSystem();
            }
            
            self.repositoryURLDialog = this.getURLDialog();
            self.repositoryDevURLDialog = this.getDevURLDialog();
        });
        
        if (autoOpen) this.openInBody();
    }
    
    openInBody(){
        let parent = document.createElement("transient");
        parent.appendChild(this.html);
        document.body.appendChild(parent);
    }
    
    setTopLevelComponent(component){
        this.topLevelComponent = component;
    }    
    
    getURLDialog(){
        let self = this;
        let repoAddTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryURL");
        let repositoryURLDialog = new WebstrateComponents.ModalDialog(
                repoAddTemplate,
                {
                    "title":"Repository URL",
                    "actions": {
                            "cancel":{},
                            "set": {primary: true, mdcIcon: "add_link"}
                    }
                }
        );
        this.topLevelComponent.appendChild(repositoryURLDialog.html);
        
        repositoryURLDialog.setTarget = (target)=>{
            repositoryURLDialog.target = target;
            
            let stepRepositoryRegistrations = WPMv2.getRegisteredRepositories(false);
            if (stepRepositoryRegistrations[target]){
                repoAddTemplate.querySelector("#repourl").value = stepRepositoryRegistrations[target];
            }                        
        };
        
        EventSystem.registerEventCallback('ModalDialog.Closing', function(evt) {
            if(evt.detail.dialog===repositoryURLDialog && evt.detail.action === "set") {
                let bootConfig = self.getBootConfig();
                
                if (bootConfig.require && Array.isArray(bootConfig.require)){
                    let repo = {};
                    repo[repositoryURLDialog.target] = repoAddTemplate.querySelector("#repourl").value;
                    if (bootConfig.require.length===0){
                        bootConfig.require = {
                            repositories: repo,
                            dependencies: []
                        };
                    } else {
                        let oldRepos = bootConfig.require[0].repositories;
                        if (!oldRepos){
                            bootConfig.require[0].repositories = repo;
                        } else {
                            bootConfig.require[0].repositories = {...bootConfig.require[0].repositories, ...repo};
                        }
                    }
                    
                    // Effectuate immediately too
                    WPMv2.registerRepository(repositoryURLDialog.target, repo[repositoryURLDialog.target]);
                }
                
                self.setBootConfig(bootConfig);
                self.showRepositories();
            }
        });        
        
        return repositoryURLDialog;
    }
    
    getDevURLDialog(){
        let self = this;
        let repoDevTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryDevURL");
        let repositoryDevURLDialog = new WebstrateComponents.ModalDialog(
                repoDevTemplate,
                {
                    "title":"Repository Dev Override",
                    "actions": {
                            "cancel":{},
                            "remove":{},
                            "set": {primary: true, mdcIcon: "add_link"}
                    }
                }
        );
        this.topLevelComponent.appendChild(repositoryDevURLDialog.html);
        
        repositoryDevURLDialog.setTarget = (target)=>{
            repositoryDevURLDialog.target = target;
            
            let stepRepositoryRegistrations = WPMv2.getRegisteredRepositories(true);
            if (stepRepositoryRegistrations[target]){
                repoDevTemplate.querySelector("#repodevurl").value = stepRepositoryRegistrations[target];
            }                        
        };
        
        EventSystem.registerEventCallback('ModalDialog.Closing', function(evt) {
            if(evt.detail.dialog===repositoryDevURLDialog){
                let value = repoDevTemplate.querySelector("#repodevurl").value;
                if (evt.detail.action === "remove" || (evt.detail.action === "set" && value.trim().length===0)){
                    WPMv2.unregisterRepository(repositoryDevURLDialog.target, true);
                } else if (evt.detail.action === "set"){
                    WPMv2.registerRepository(repositoryDevURLDialog.target, value, true);
                }
            }
            self.showRepositories();
        });        
        
        return repositoryDevURLDialog;
    }    
    
    
    async renderRepository(repositoryName, repositoryView){
        let self = this;
        let repositoryPackages = await WPMv2.getPackagesFromRepository(repositoryName);
        let bootConfig = this.getBootConfig();

        let repositoryRepositoryTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryItem_repository");            
        let repositoryBodyTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryItem_body");            
        let repoListDiv = repositoryView.querySelector(".repository-list");
        repoListDiv.innerHTML = "";
        repoListDiv.appendChild(repositoryRepositoryTemplate);
        repoListDiv.appendChild(repositoryBodyTemplate);

        let renderBody = ()=>{            
            let installedFromRepository = WPMv2.getCurrentlyInstalledPackages().filter(pkg=>pkg.repository&&pkg.repository==repositoryName);
            // TODO: Handle packages that are in the bootConfig requirestep for this repo but aren't in the repo
            let repositoryIsThisPage = WPMv2.getLocalRepositoryURL && (repositoryName == WPMv2.getLocalRepositoryURL());
                        
            for (let packageInfo of repositoryPackages){
                if (packageInfo.repository && packageInfo.repository!=repositoryName) continue; // This package is not actually from here but somewhere else
                repositoryBodyTemplate.appendChild(self.renderPackageItem(packageInfo, bootConfig, {repositoryIsThisPage:repositoryIsThisPage}));
                installedFromRepository = installedFromRepository.filter(pkg=>pkg.name!=packageInfo.name);
            }                

            // Render packages that claim to be in this repository, but aren't
            installedFromRepository.forEach((packageInfo)=>{
                repositoryBodyTemplate.appendChild(self.renderPackageItem(packageInfo, bootConfig, {missingInRepository:true}));
            });
        };
        await renderBody();

        // Repository-wide override buttons
        repositoryRepositoryTemplate.querySelector(".repository-require input").checked = self.isConfigDirectlyRequiringRepository(bootConfig, repositoryName);
        repositoryRepositoryTemplate.querySelector(".repository-require input").addEventListener("click", async (evt)=>{
            // Enabled repository-wide require option, remove any per-package settings from bootConfig
            for (let packageInfo of repositoryPackages){
                await self.removePackageRequire(packageInfo);
            }

            if (evt.target.checked){
                await self.addRepositoryRequire(repositoryName);
            } else {                       
                await self.removeRepositoryRequire(repositoryName);
            }

            bootConfig = self.getBootConfig();
            repositoryBodyTemplate.innerHTML = "";
            await renderBody();
        });

        repositoryRepositoryTemplate.querySelector(".repository-embed").addEventListener("click", async (evt)=>{
            let embedMenu = MenuSystem.MenuManager.createMenu("PackageBrowser.RepositoryEmbed", {
                growDirection: MenuSystem.Menu.GrowDirection.DOWN
            });         
            embedMenu.addItem({
                label: "Embed In-Use",
                order: 100,
                group: "Fetching",
                groupOrder: 200,
                icon: IconRegistry.createIcon("mdc:downloading"),
                onAction: async ()=>{               
                    let packagesToEmbed = [];
                    for (let packageInfo of repositoryPackages){
                        let inUse = self.getLocalPackageElement(packageInfo.name);
                        if (inUse && (self.isTransientPackageElement(inUse))){
                            packagesToEmbed.push(packageInfo);
                        }
                    }
                    console.log(packagesToEmbed);
                    await self.embedPackages(packagesToEmbed);
                    self.renderRepository(repositoryName, repositoryView);
                }
            });
            embedMenu.addItem({
                label: "Embed All",
                icon: IconRegistry.createIcon("mdc:download_for_offline"),
                group: "Fetching",
                groupOrder: 200,
                order: 200,
                onAction: async ()=>{
                    if (confirm("This will bloat the page, the repository may not be designed to have ALL packages embedded and newly added packages will not be included")){
                        let packagesToEmbed = []
                        for (let packageInfo of repositoryPackages){
                            let localPackageElement = self.getLocalPackageElement(packageInfo.name);
                            
                            if ((!localPackageElement)||self.isTransientPackageElement(localPackageElement)){
                                packagesToEmbed.push(packageInfo);
                            }
                        }
                        await self.embedPackages(packagesToEmbed);
                        self.renderRepository(repositoryName, repositoryView);                        
                    }
                }
            });                 
            embedMenu.addItem({
                label: "Remove All Embedded",
                icon: IconRegistry.createIcon("mdc:delete"),
                group: "Destruction",
                groupOrder: 999,
                order: 999,
                onAction: async ()=>{          
                    let packagesOnlyOnThisPage = 0;
                    let packagesToUnembed = [];
                    for (let packageInfo of repositoryPackages){
                        let localPackageElement = self.getLocalPackageElement(packageInfo.name);
                        if (localPackageElement && !self.isTransientPackageElement(localPackageElement)){
                            if (packageInfo.repository && WPMv2.getLocalRepositoryURL && packageInfo.repository==WPMv2.getLocalRepositoryURL()){
                                packagesOnlyOnThisPage++;
                            }
                            packagesToUnembed.push(packageInfo);
                        }                            
                    }       
                    
                    if ((!packagesOnlyOnThisPage) || confirm("This will permanently delete "+packagesOnlyOnThisPage+" packages that ONLY exist in this page"))
                    for (let pkg of packagesToUnembed){
                        await self.unembedPackage(pkg);
                    }
                            
                    self.renderRepository(repositoryName, repositoryView);
                }
            });                

            embedMenu.registerOnCloseCallback(() => {
                if (embedMenu.html.parentNode !== null) {
                    embedMenu.html.parentNode.removeChild(embedMenu.html);
                }
            });                

            self.html.appendChild(embedMenu.html);

            embedMenu.open({
                x: evt.clientX,
                y: evt.clientY
            });
            evt.stopPropagation();
            evt.preventDefault();
        });
    };    
    
    showRepositories() {
        let self = this;
        this.mainView.innerHTML="";
        
        let repositoryView = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryList");
        
        // General actions for repositories
        let repoAddTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryAdder");
        let addRepositoryDialog = new WebstrateComponents.ModalDialog(
                repoAddTemplate,
                {
                    "title":"Add Repository",
                    "actions": {
                            "cancel":{},
                            "next": {primary: true, mdcIcon: "add_link"}
                    }
                }
        );
        self.topLevelComponent.appendChild(addRepositoryDialog.html);
        EventSystem.registerEventCallback('ModalDialog.Closing', function(evt) {
            if(evt.detail.dialog===addRepositoryDialog && evt.detail.action === "next") {
                let bootConfig = self.getBootConfig();
                let value = repoAddTemplate.querySelector("#repoid").value.trim();
                if (value.length>0){
                    if ((!bootConfig.knownRepositories) || !Array.isArray(bootConfig.knownRepositories)){
                        bootConfig.knownRepositories = []; // Destructive conformity
                    }
                    bootConfig.knownRepositories.push(repoAddTemplate.querySelector("#repoid").value);
                    self.setBootConfig(bootConfig);
                    self.showRepositories();
                    
                    // TODO: .scrollIntoView() ?
                }
            }
        });
        
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
            for (let repoName of bootConfig.knownRepositories){
                if (!knownRepositories.includes(repoName)){
                    knownRepositories.push(repoName);
                }
            }
        }
        
        // Sort it and show it
        let sortedRepositories = knownRepositories.sort();        
        let overviewAddItemTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserAddListItem");                        
        for (let repositoryName of sortedRepositories){            
            let overviewListItemTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserRepositoryListItem");
            if (WPMv2.getLocalRepositoryURL && repositoryName == WPMv2.getLocalRepositoryURL()){
                overviewListItemTemplate.querySelector(".repository-name").innerHTML = "⌂ This Page";
                overviewListItemTemplate.querySelector(".repository-url").innerText = repositoryName;
            } else {
                overviewListItemTemplate.querySelector(".repository-name").title = repositoryName;            
                overviewListItemTemplate.querySelector(".repository-name").innerText = repositoryName.replace("-repos","").replaceAll("_"," ").replaceAll("-", " ");
            }
            
            // Check if this is mapped somewhere with the bootloader
            // STUB: Currently this uses WPMv2 instead of the bootstep to resolve it   
            let stepRepositoryRegistrations = WPMv2.getRegisteredRepositories(false);
            if (stepRepositoryRegistrations[repositoryName]){
                overviewListItemTemplate.querySelector(".repository-url").innerText = stepRepositoryRegistrations[repositoryName];
                overviewListItemTemplate.querySelector(".repository-url").title = stepRepositoryRegistrations[repositoryName];
            }
            
            // Check if this is mapped somewhere with any overrides
            // STUB: Currently this uses WPMv2 instead of the bootstep to resolve it
            let overrideRepositoryRegistrations = WPMv2.getRegisteredRepositories(true);
            if (overrideRepositoryRegistrations[repositoryName]){
                overviewListItemTemplate.querySelector(".repository-url").title = overviewListItemTemplate.querySelector(".repository-url").innerText+ " overridden by site-wide developer setting in this browser";
                overviewListItemTemplate.querySelector(".repository-url").innerText = overrideRepositoryRegistrations[repositoryName];
                overviewListItemTemplate.querySelector(".repository-url").style.color="red";
            }     
            
            overviewListItemTemplate.querySelector(".repository-more").addEventListener("click", (evt)=>{
                let moreMenu = MenuSystem.MenuManager.createMenu("PackageBrowser.RepositoryMore", {
                    growDirection: MenuSystem.Menu.GrowDirection.DOWN
                });         
                moreMenu.addItem({
                    label: "Remove",
                    order: 10,
                    icon: IconRegistry.createIcon("mdc:delete_outline"),
                    onAction: ()=>{                        
                        let bootConfig = self.getBootConfig();
                        if ((!bootConfig.knownRepositories) || !Array.isArray(bootConfig.knownRepositories)){
                            console.log("Couldn't understand bootConfig.knownRepositories", bootConfig.knownRepositories);
                            return;
                        } else {
                            bootConfig.knownRepositories = bootConfig.knownRepositories.filter(e => e !== repositoryName);
                            self.setBootConfig(bootConfig);
                            self.showRepositories();
                        }
                    }
                });
                moreMenu.addItem({
                    label: "Source URL...",
                    icon: IconRegistry.createIcon("mdc:link"),
                    order: 900,
                    onAction: ()=>{     
                        self.repositoryURLDialog.setTarget(repositoryName);
                        self.repositoryURLDialog.open();
                    }
                });                 
                moreMenu.addItem({
                    label: "Dev Override...",
                    icon: IconRegistry.createIcon("mdc:assistant_direction"),
                    order: 999,
                    onAction: ()=>{                        
                        self.repositoryDevURLDialog.setTarget(repositoryName);
                        self.repositoryDevURLDialog.open();
                    }
                });                
                
                moreMenu.registerOnCloseCallback(() => {
                    if (moreMenu.html.parentNode !== null) {
                        moreMenu.html.parentNode.removeChild(moreMenu.html);
                    }
                });                
                
                self.html.appendChild(moreMenu.html);
                moreMenu.open({
                    x: evt.clientX,
                    y: evt.clientY
                });
                evt.stopPropagation();
                evt.preventDefault();
            });
            
            // Insert into overview of repositories
            repositoryView.querySelector(".repository-overview").appendChild(overviewListItemTemplate);
        }
        repositoryView.querySelector(".repository-overview").appendChild(overviewAddItemTemplate);        
        repositoryView.querySelector(".add-repository").addEventListener("click", ()=>{
            addRepositoryDialog.html.querySelector("#repoid").value = "";
            addRepositoryDialog.open();
        });                
        
        mdc.autoInit(repositoryView);        
        let list = repositoryView.querySelector(".repository-overview").MDCList;
        list.singleSelection = true;
        list.listen("MDCList:action", async (evt)=>{            
            if (evt.detail.index > sortedRepositories.length) return;
            let repositoryName = sortedRepositories[evt.detail.index];
            self.renderRepository(repositoryName, repositoryView);
        });   
        list.selectedIndex = 0;
        if (sortedRepositories.length>0) self.renderRepository(sortedRepositories[0], repositoryView);
        
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
        }
        
        // Config
        
    }

    
    getBootConfig(){
        try {
            let element = document.querySelector("script[type='text/json+bootconfig']");
            if (!element) throw Error("No bootconfig defined");

            let j = JSON.parse(element.textContent);
            return j;
        } catch (ex){
            console.log("PackageBrowser error", ex);
        }
        
        // We assume that we may create a new empty boot config if it doesn't exist
        let bootConfig = {
            creator: "WPMPackageManager",
            created: Date.now(),
            require: []
        };

        return bootConfig;
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
    
    isLive(packageElement){
        return packageElement.getAttribute("transient-wpm-live")!==null;
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
            // Otherwise we assume a transient-element tag is used to mark it
            console.log("Trying to match ", packageElement.tagName);
            if (packageElement.closest("[transient-wpmid]")){
                return true;
            } else {
                return false;
            }
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
    
    async embedPackages(wpmPackages){
        // Prepare for this package to be embedded
        let requiredPackages = [];
        wpmPackages.forEach((wpmPackage)=>{
            let localPackageElement = this.getLocalPackageElement(wpmPackage.name);
            if (localPackageElement && this.isTransientPackageElement(localPackageElement)){
                // Already installed transiently, remove first
                localPackageElement.remove();
                //Also remove wpm transient element if found
                document.querySelector("[transient-wpmid='"+wpmPackage.name+"']")?.remove();
            };
            requiredPackages.push({package:wpmPackage.name, repository:wpmPackage.repository, appendTarget:"head"});
        });

        await wpm.require(requiredPackages, {"bootstrap":"false"}); // install it right away
    }
    
    async unembedPackage(wpmPackage){
        let localPackageElement = this.getLocalPackageElement(wpmPackage.name); // update the package element          
        localPackageElement.remove();

        if (this.isConfigDirectlyRequiringPackage(this.getBootConfig(), wpmPackage.name)){
            // Re-install transiently if required
            await wpm.require(wpmPackage);
        };                    
    }
    
    renderPackageItem(wpmPackage, bootConfig, displayOptions={}){
        let self = this;
       
        let packageItemTemplate = WebstrateComponents.Tools.loadTemplate("#packageBrowserPackageItem");
        if (displayOptions.missingInRepository){
            packageItemTemplate.classList.add("missing");
            packageItemTemplate.title="This package could not be found in the repository";
        };
      
        if (!wpmPackage.name){            
            return WebstrateComponents.Tools.loadTemplate("#packageBrowserPackageItemError");            
        }
        packageItemTemplate.querySelector(".package-name").innerText = wpmPackage.name;
        packageItemTemplate.querySelector(".package-name").title = wpmPackage.name;
        
        ["version", "description", "license"].forEach((packageProperty)=>{
            if (wpmPackage[packageProperty]){
                packageItemTemplate.querySelector(".package-"+packageProperty).innerText = wpmPackage[packageProperty];
                packageItemTemplate.querySelector(".package-"+packageProperty).title = wpmPackage[packageProperty];
            }
        });
        
        let localPackageElement = this.getLocalPackageElement(wpmPackage.name);
        if (localPackageElement) {           
            // Check if required directly or because of dependency/system            
            if (this.isConfigDirectlyRequiringPackage(bootConfig, wpmPackage.name)){
                packageItemTemplate.querySelector(".package-required input").checked = true;
            } else {
                if (this.isLive(localPackageElement)){
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
            }

            // Embedding status
            packageItemTemplate.querySelector(".package-embedded input").checked = !this.isTransientPackageElement(localPackageElement);
            if (this.isForcedEmbeddedPackage(wpmPackage)){
                packageItemTemplate.querySelector(".package-embedded input").setAttribute("title", "This package wants to be embedded when installed");
            }
        }
        
        
        // Click handlers
        packageItemTemplate.querySelector(".package-required input").addEventListener("click", async (box)=>{
            if (box.target.checked){ 
                // Require a package
                if (self.isForcedEmbeddedPackage(wpmPackage) && !packageItemTemplate.querySelector(".package-embedded input").checked){
                    await self.embedPackages([wpmPackage]);
                    packageItemTemplate.querySelector(".package-embedded input").checked = true;

                }
                await self.addPackageRequire(wpmPackage);
            } else {
                if (self.isForcedEmbeddedPackage(wpmPackage) && packageItemTemplate.querySelector(".package-embedded input").checked){
                    await self.unembedPackage(wpmPackage);
                    packageItemTemplate.querySelector(".package-embedded input").checked = false;
                }

                // Remove require for a package
                await self.removePackageRequire(wpmPackage);
            }
            localPackageElement = self.getLocalPackageElement(wpmPackage.name); // update the package element
        });
        
        packageItemTemplate.querySelector(".package-embedded input").addEventListener("click",async (box)=>{
            if (box.target.checked){
                await self.embedPackages([wpmPackage]);
                packageItemTemplate.querySelector(".package-embedded input").checked = true;
            } else {                
                if (((!displayOptions.missingInRepository) || confirm("This package is missing in the repository, removing it will permanently delete it"))
                        &&
                       ((!displayOptions.repositoryIsThisPage) || confirm("The package only exists in this page, removing it will permanently delete it"))) {
                    await self.unembedPackage(wpmPackage);
                    packageItemTemplate.querySelector(".package-embedded input").checked = false;
                    if (self.isForcedEmbeddedPackage(wpmPackage) && packageItemTemplate.querySelector(".package-required input").checked){
                        await self.removePackageRequire(wpmPackage);
                        packageItemTemplate.querySelector(".package-required input").checked = false;
                    }
                } else {
                    packageItemTemplate.querySelector(".package-embedded input").checked = true;
                }
            }   
            localPackageElement = self.getLocalPackageElement(wpmPackage.name); // update the package element
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
