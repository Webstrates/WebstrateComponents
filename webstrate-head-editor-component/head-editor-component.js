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
    constructor(autoOpen=true) {
        let self = this;
        self.html = WebstrateComponents.Tools.loadTemplate("#headEditorBase");
        
        if (autoOpen) this.openInBody();
    }
    
    openInBody(){
        let parent = document.createElement("transient");
        parent.appendChild(this.html);
        document.body.appendChild(parent);
    }
};
