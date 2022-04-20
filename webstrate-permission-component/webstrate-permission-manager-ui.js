/**
 *  Permission Manager UI
 *  UI code for controller permissions on a Webstrate
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
    
class PermissionManagerUI {
    constructor() {
        let self = this;
        
        this.topLevelComponent = document.body;

        this.html = WebstrateComponents.Tools.loadTemplate("#webstrate-components-permission-ui-tpl");

        this.html.querySelectorAll(".mdc-button").forEach((button)=>{
            new mdc.ripple.MDCRipple(button);
        });

        EventSystem.registerEventCallback("PermissionManager.Permissions.Changed", ({detail:{permissions: permissions}})=>{
            self.reload(permissions);
        });

        this.reload(WebstrateComponents.PermissionManager.singleton.permissions);

        this.html.querySelector("button.addPermission").addEventListener("click", ()=>{
            self.showAddDialog();
        });

        this.html.querySelector("button.savePermissions").addEventListener("click", ()=>{
            if(WebstrateComponents.PermissionManager.singleton.save()) {
                EventSystem.triggerEvent("PermissionManagerUI.Saved", this);
            }
        });
    }
    
    setTopLevelComponent(component){
        this.topLevelComponent = component;
    }

    async showAddDialog() {
        let dialogTpl = WebstrateComponents.Tools.loadTemplate("#webstrate-components-permission-add-permission-dialog-tpl");

        let dialog = new WebstrateComponents.ModalDialog(dialogTpl);
        let transient = document.createElement("transient");
        transient.appendChild(dialog.html);
        this.topLevelComponent.appendChild(transient);

        let permissionTpl = WebstrateComponents.Tools.loadTemplate("#webstrate-components-permission-adduser-tpl");
        dialogTpl.querySelector("tbody").appendChild(permissionTpl);

        new mdc.textField.MDCTextField(permissionTpl.querySelector('.mdc-text-field'));

        dialogTpl.querySelectorAll('.mdc-radio').forEach((radio)=>{
            new mdc.radio.MDCRadio(radio);
        });
        dialogTpl.querySelectorAll('.mdc-form-field').forEach((formField)=>{
            new mdc.formField.MDCFormField(formField);
        });
        
        dialog.open();

        EventSystem.registerEventCallback('ModalDialog.Closed', function(evt) {
            //Remove template after use
            transient.remove();

            if(evt.detail.dialog===dialog && evt.detail.action === "add") {
                let usernameProvider = dialogTpl.querySelector(".username input").value.split(":");
                let permissionString = dialogTpl.querySelector("input[type='radio']:checked").value;

                if(usernameProvider.length === 2 && usernameProvider[0].trim() !== "" && usernameProvider[1].trim() !== "") {
                    let permission = new WebstrateComponents.Permission(usernameProvider[0], usernameProvider[1], permissionString);

                    WebstrateComponents.PermissionManager.singleton.setPermission(permission);
                } else {
                    alert("You mistyped something, must be 'username:provider'");
                }
            }
        });
    }

    reload(permissions) {
        let tbody = this.html.querySelector("tbody");

        //Empty tbody
        while(tbody.firstChild) tbody.firstChild.remove();

        permissions.forEach((perm)=>{
            let permissionTpl = WebstrateComponents.Tools.loadTemplate("#webstrate-components-permission-user-tpl");

            let prefix = perm.username+"_"+perm.provider+"_";

            //Rename all input id and name attributes
            permissionTpl.querySelectorAll("input").forEach((input)=>{
                input.id = prefix + input.id;
                input.name = prefix + input.name;

                input.addEventListener("input", ()=>{
                    perm.setPermission(input.value);
                });
            })

            //Rename all label for attributes
            permissionTpl.querySelectorAll("label").forEach((label)=>{
                label.setAttribute("for", prefix + label.getAttribute("for"));
            });

            permissionTpl.querySelectorAll('.mdc-radio').forEach((radio)=>{
                new mdc.radio.MDCRadio(radio);
            });

            permissionTpl.querySelectorAll('.mdc-form-field').forEach((formField)=>{
                new mdc.formField.MDCFormField(formField);
            });

            let checkedSelector = "";

            if(perm.hasPermission("a")) {
                checkedSelector = prefix+"admin";
            } else if(perm.hasPermission("w")) {
                checkedSelector = prefix+"write";
            } else if(perm.hasPermission("r")) {
                checkedSelector = prefix+"read";
            } else {
                checkedSelector = prefix+"none";
            }

            permissionTpl.querySelector("#"+checkedSelector).checked = true;

            permissionTpl.querySelector(".username").textContent = perm.username+(perm.provider.trim()===""?"":":"+perm.provider);

            if(perm.username === "anonymous" && perm.provider === "") {
                permissionTpl.querySelector(".deletePermission").remove();
            } else {
                permissionTpl.querySelector(".deletePermission").addEventListener("click", ()=>{
                    WebstrateComponents.PermissionManager.singleton.removePermission(perm);
                });
            }

            tbody.appendChild(permissionTpl);
        });
    }
}

window.WebstrateComponents.PermissionManagerUI = PermissionManagerUI;