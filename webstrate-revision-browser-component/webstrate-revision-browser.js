/**
 *  Revision Browser
 *  Manage revisions of a Webstrate in a visual editor
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
 * Manage revisions of a Webstrate in a visual editor
 */
window.RevisionBrowser = class RevisionBrowser {
    constructor() {
        let self = this;

        this.selfItemTemplate = WebstrateComponents.Tools.loadTemplate("#revisionBrowserSelfItem");
        this.listItemTemplate = WebstrateComponents.Tools.loadTemplate("#revisionBrowserListItem");
        this.cardTemplate = WebstrateComponents.Tools.loadTemplate("#revisionBrowserPresentationCard");
        this.tagTemplate = WebstrateComponents.Tools.loadTemplate("#revisionBrowserTaggingCard");

        this.html = WebstrateComponents.Tools.loadTemplate("#revision-browser-base");

        this.populateList();

        webstrate.on("tag", ()=>{
            self.populateList();
        });

        let revisionSelector = cQuery(this.html).find(".revisionSelector");
        revisionSelector[0].value = webstrate.version;

        revisionSelector.on("input", ()=>{
            if(parseInt(revisionSelector[0].value) > webstrate.version) {
                revisionSelector[0].value = webstrate.version;
            }
            self.loadRevision(revisionSelector[0].value);
            self.unselect();
            self.selectTagFromRevision(revisionSelector[0].value);

        });
    }

    loadTagUI() {
        let self = this;
        let target = cQuery(this.html).find(".revision_framecontainer");
        target.empty();
        let card = this.tagTemplate.cloneNode(true);
        let tagButton = cQuery(card).find(".tagButton");
        tagButton.on("click", ()=>{        
            let label = window.prompt("Enter wanted tag label:");

            if(label != null && label.trim() !== "") {
                webstrate.on("tag", function once(version, label) {
                    console.log("Saved tag:", version, label);
                    webstrate.off("tag", once);
                });

                webstrate.tag(label);
            }        
        });
        
        mdc.autoInit(card);        
        target.append(card);
    }

    loadRevision(revision, tagLabel = null) {
        let self = this;

        let tags = webstrate.tags();
        let tagList = Object.keys(tags).sort((v1, v2)=>{
            return parseInt(v2) - parseInt(v1);
        });

        let target = cQuery(this.html).find(".revision_framecontainer");

        let card = this.cardTemplate.cloneNode(true);
        let frameTarget = cQuery(card).one("iframe");
        let authorTarget = cQuery(card).one(".revision-author");
        let deleteButton = cQuery(card).find(".deleteButton");
        let restoreButton = cQuery(card).find(".restoreButton");

        target.empty();
        if (!revision) return;
        
        frameTarget.src = revision;
        cQuery(card).one(".revision-name").innerText = tags[revision];
        mdc.autoInit(card);
        target.append(card);

        webstrate.getOps(parseInt(revision)-1,parseInt(revision), (err, ops) => {
            let username = "System";
            if (ops != null && ops.length > 0){
                if (ops[0].session){
                    username = ops[0].session.userId;
                } else {
                    username = ops[0].src;
                }
            }
            if (username == "anonymous:") username = "Anonymous";
            authorTarget.innerText = "by "+username;
        });

        restoreButton.on("click", ()=>{
            webstrate.restore(parseInt(revision), (err, newVersion) =>{
                if(err) {
                    console.error(err);
                } else {
                    console.log("Successfully restored");
                    EventSystem.triggerEvent("RevisionBrowser.OnRestore", self);
                }
            });
        });

        if(tagLabel != null) {
            deleteButton.on("click", ()=>{

                console.log("Deleting: ", tagLabel);

                webstrate.untag(tagLabel);

                target.empty();

                self.populateList();
            });
        } else {
            deleteButton.remove();
        }
    }
    
    unselect(){
        cQuery(this.html).find(".mdc-list-item--selected").removeClass("mdc-list-item--selected");
        cQuery(this.html).find(".mdc-list")[0].MDCList.foundation.selectedIndex_ = -1;
    }

    selectTagFromRevision(revision) {
        let listItem = cQuery(this.html).find(".mdc-list-item[data-revision='"+revision+"']");

        if(listItem != null) {
            let foundIndex = -1;

            cQuery(this.html).find(".mdc-list")[0].MDCList.listElements.forEach((listElement, index)=>{
                if(listItem[0] === listElement) {
                    foundIndex = index;
                }
            });

            cQuery(this.html).find(".mdc-list")[0].MDCList.selectedIndex = foundIndex;
        }
    }

    populateList() {
        let self = this;

        // Populate list
        let tags = webstrate.tags();
        let tagList = Object.keys(tags).sort((v1, v2)=>{
            return parseInt(v2) - parseInt(v1);
        });
        let browserList = cQuery(this.html).one(".mdc-list");

        //Clear old entries
        cQuery(browserList).find(".mdc-list-item").remove();

        let currentItem = this.selfItemTemplate.cloneNode(true);
        cQuery(currentItem).one(".revision-subtext").innerText = "Revision "+webstrate.version;
        currentItem.setAttribute("data-revision", webstrate.version);
        browserList.append(currentItem);        

        tagList.forEach((revision)=>{
            let listItem = this.listItemTemplate.cloneNode(true);
            cQuery(listItem).one(".revision-name").innerText = tags[revision];
            cQuery(listItem).one(".revision-subtext").innerText = "Revision "+revision;
            browserList.append(listItem);
            listItem.setAttribute("data-revision", revision);
        });

        // Auto-init all the components
        mdc.autoInit(this.html);

        // Configure list and preview
        let list = browserList.MDCList;
        list.singleSelection = true;

        list.listen("MDCList:action", (evt)=>{
            if (evt.detail.index>0){
                let revision = tagList[evt.detail.index-1];
                let tagLabel = tags[revision];

                self.loadRevision(revision, tagLabel);
                cQuery(self.html).find(".revisionSelector")[0].value=revision;
            } else {
                self.loadTagUI();
            }
        });
        
        list.selectedIndex = 0;
        this.loadTagUI();
    }
};
