/**
 *  Package Browser
 *  Visual browser for installing WPM packages into a Webstrate
 * 
 *  Copyright 2022 Rolf Bagge & Janus B. Kristensen, CAVI,
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

window.HeadEditorComponent = class HeadEditorComponent {
    constructor(autoOpen = true) {
        let self = this;
        self.html = WebstrateComponents.Tools.loadTemplate("#headEditorBase");

        // WPMv2 then
        self.setupBasicProperties();
        //

        if (autoOpen)
            this.openInBody();
    }

    setupBasicProperties() {
        let self = this;
        
        // Title
        self.html.querySelector("#title-input").value = document.title;
        self.html.querySelector("#title-input").addEventListener("input", () => {
            let newTitle = self.html.querySelector("#title-input").value.trim();
            document.title = newTitle;
            let titleElement = document.head.querySelector("title");
            if (newTitle.length === 0) {
                if (titleElement){
                    titleElement.remove();
                }
            } else {
                if (titleElement){
                    WPMv2.stripProtection(titleElement);
                }
            }
        });
        
        ["author","keywords","description"].forEach((metaField)=>{
            try {
                self.html.querySelector("#"+metaField+"-input").value = document.querySelector("head meta[name='"+metaField+"']").getAttribute("content");
            } catch (ex){
                // Ignore missing fields
            }
            
            self.html.querySelector("#"+metaField+"-input").addEventListener("input", () => {
                let newValue = self.html.querySelector("#"+metaField+"-input").value.trim();
                
                let metaElement = document.head.querySelector('meta[name="'+metaField+'"]');
                if (newValue.length === 0){
                    if (metaElement){
                        metaElement.remove();
                    }
                } else {
                    if (!metaElement){
                        metaElement = document.createElement("meta");
                        metaElement.setAttribute("name", metaField);
                        WPMv2.stripProtection(metaElement);
                        document.head.appendChild(metaElement);
                    }
                    metaElement.setAttribute("content", newValue);
                }
            });
        });
    }

    openInBody() {
        let parent = document.createElement("transient");
        parent.appendChild(this.html);
        document.body.appendChild(parent);
    }
};


// tags: 
//  title
//  script:not(unapproved)
//  link rel href
//  base href, target
// meta: 
//  viewport, keywords, description, author