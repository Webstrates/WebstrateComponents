/**
 *  Permission Manager
 *  Low-level interface to control permissions on a Webstrate
 * 
 *  Copyright 2020, 2021 Rolf Bagge, Janus B. Kristensen
 *  Copyright 2025, Janus B. Kristensen, CAVI
 *  Center for Advanced Visualization and Interacion, Aarhus University
 *  
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
 * Handles managing permissions
 */
class PermissionManager {
    constructor() {
        this.permissions = [];

        this.loadPermissions();

        this.observer = new MutationObserver((mutations)=>{
            this.loadPermissions();
        });

        this.startObserver();
    }

    async executeObserverless(executor) {
        let mutations = this.observer.takeRecords();
        if(mutations.length > 0) {
            this.loadPermissions();
        }
        this.observer.disconnect();

        await executor();

        this.startObserver();
    }

    startObserver() {
        this.observer.observe(document.querySelector("html"), {
            attributes: true,
            attributeFilter: ["data-auth"]
        });
    }

    loadPermissions() {
        let self = this;
        self.permissions = [];

        try {
            const permissionJson = JSON.parse(document.querySelector("html").getAttribute("data-auth"));

            if (permissionJson != null) {
                permissionJson.forEach((perm) => {
                    if (perm.webstrateId != null) {
                        //Inherit permissions
                        console.warn("This webstrate is inheriting permissions (Unsupported) from: ", perm.webstrateId);
                    } else {
                        self.permissions.push(new Permission(perm.username, perm.provider, perm.permissions));
                    }
                });
            }
        } catch (e) {
            console.warn("Failed to parse permissions: ", e);
            alert("Warning: Failed to parse permissions. Saving will overwrite existing malformed permissions. See console for details.");
        }

        this.checkAnonymousUser();

        EventSystem.triggerEvent("PermissionManager.Permissions.Changed", {
            permissions: this.permissions
        });
    }

    checkAnonymousUser() {
        if(this.permissions.length === 0){
            // STUB: We currently have no way of knowing the default permissions on this server so we assume "arw" for anonymous
            this.permissions.push(new Permission("anonymous", "", "arw"));
        }
    }

    setPermission(permission) {
        console.log("Setting permission: ", permission);

        let oldPermission = this.permissions.find((perm)=>{
            return permission.username === perm.username && permission.provider === perm.provider;
        });

        if(oldPermission != null) {
            oldPermission.permissions = permission.permissions;
        } else {
            this.permissions.push(permission);
        }

        this.checkAnonymousUser();

        EventSystem.triggerEvent("PermissionManager.Permissions.Changed", {
            permissions: this.permissions
        });
    }

    removePermission(permission) {
        this.permissions = this.permissions.filter((perm)=>{
            return permission.username !== perm.username || permission.provider !== perm.provider;
        });

        this.checkAnonymousUser();

        EventSystem.triggerEvent("PermissionManager.Permissions.Changed", {
            permissions: this.permissions
        });
    }

    save() {
        if(this.permissions.length === 0 || (this.permissions.length === 1 && this.permissions[0].username === "anonymous")) {
            //Empty permissions, remove auth property, everyone can do anything!
            if(confirm("After saving everyone has full access to this webstrate.\nContinue?")) {
                document.querySelector("html").removeAttribute("data-auth");
                return true;
            } else {
                return false;
            }
        } else {
            //Checks for the current user not locking himself out
            let ourPermissions = this.permissions.find((perm)=>{
                return perm.username === webstrate.user.username && perm.provider === webstrate.user.provider;
            });

            let anonPermissions = this.permissions.find((perm)=>{
                return perm.username === "anonymous" && perm.provider === "";
            });

            let anyAdmin = this.permissions.find((perm)=>{
                return perm.hasPermission("a");
            }) != null;

            if(ourPermissions == null) {
                //If our user does not exist, we are anon
                ourPermissions = anonPermissions;
            }

            let canRead = ourPermissions!=null?ourPermissions.hasPermission("r"):false;
            let canWrite = ourPermissions!=null?ourPermissions.hasPermission("w"):false;
            let canAdmin = ourPermissions!=null?((anyAdmin)?ourPermissions.hasPermission("a"):canWrite):false;

            let permissionsJson = JSON.stringify(this.permissions.map((perm)=>{
                return perm.toJson();
            }));

            if(!canAdmin) {
                if(confirm("You are removing your own admin permission.\nContinue?")) {
                    document.querySelector("html").setAttribute("data-auth", permissionsJson, {approved: true});
                    return true;
                } else {
                    return false;
                }
            } else {
                document.querySelector("html").setAttribute("data-auth", permissionsJson, {approved: true});
                return true;
            }
        }
    }
    
    static isAdmin(){
        return webstrate.user.permissions.includes("a");
    }
}

window.WebstrateComponents.PermissionManager = PermissionManager;

class Permission {
    constructor(username, provider, permissionString) {
        this.username = username;
        this.provider = provider;
        this.permissions = new Set();

        this.loadPermissions(permissionString);
    }

    loadPermissions(permissionString) {
        this.permissions.clear();

        for(let i = 0; i<permissionString.length; i++) {
            let p = permissionString.charAt(i);

            switch(p) {
                case "a":
                    this.permissions.add("a");
                case "w":
                    this.permissions.add("w");
                case "r":
                    this.permissions.add("r");
                    break;

                default:
                    console.warn("Unknown permission: ", p);
            }
        }
    }

    setPermission(perm) {
        this.permissions.clear();

        switch(perm) {
            case "a":
                this.permissions.add("a");
            case "w":
                this.permissions.add("w");
            case "r":
                this.permissions.add("r");
            default:
                console.warn("Unknown permission: ", perm);
        }
    }

    hasPermission(perm) {
        return this.permissions.has(perm);
    }

    toJson() {
        return {
            username: this.username,
            provider: this.provider,
            permissions: Array.from(this.permissions).join("")
        };
    }
}

window.WebstrateComponents.Permission = Permission;

//Load right away
WebstrateComponents.PermissionManager.singleton = new PermissionManager();
