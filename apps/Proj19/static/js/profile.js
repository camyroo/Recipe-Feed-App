// Daniel - Profile Page Vue.js Application
"use strict";

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

let profileApp = {};

profileApp.empty_profile = {
    name: "",
    bio: "",
    profile_picture: ""
};

profileApp.config = {
    data() {
        return {
            profile: clone(profileApp.empty_profile),
            user_email: user_email,
            user_id: user_id,
            edit_mode: false,
            error_message: "",
            success_message: "",
            selected_file: null,
            user_recipe_count: 0
        };
    },

    methods: {
        toggle_edit_mode() {
            if (this.edit_mode) {
                // Save changes
                this.save_profile();
            } else {
                // Enter edit mode
                this.edit_mode = true;
                this.clear_messages();
            }
        },

        save_profile() {
            this.clear_messages();
            
            let profile_data = {
                name: this.profile.name,
                bio: this.profile.bio,
                profile_picture: this.profile.profile_picture
            };

            fetch("/Proj19/api/profile", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile_data)
            })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    this.success_message = res.message;
                    this.edit_mode = false;
                    this.selected_file = null;
                    
                    // Clear success message after 3 seconds
                    setTimeout(() => {
                        this.success_message = "";
                    }, 3000);
                } else {
                    this.error_message = "Failed to update profile";
                }
            })
            .catch(error => {
                console.error("Error saving profile:", error);
                this.error_message = "An error occurred while saving your profile";
            });
        },

        handle_file_upload(event) {
            const file = event.target.files[0];
            if (file) {
                this.selected_file = file;
                
                // Create a preview URL for the image
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.profile.profile_picture = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },

        clear_messages() {
            this.error_message = "";
            this.success_message = "";
        },

        load_profile() {
            fetch("/Proj19/api/profile", {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
            })
            .then(res => res.json())
            .then(data => {
                if (data.profile) {
                    this.profile = data.profile;
                }
            })
            .catch(error => {
                console.error("Error loading profile:", error);
                this.error_message = "Failed to load profile data";
            });
        },

        load_user_stats() {
            // Load user's recipe count
            fetch("/Proj19/api/recipes", {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
            })
            .then(res => res.json())
            .then(data => {
                if (data.recipes && data.username) {
                    // Count recipes by current user
                    this.user_recipe_count = data.recipes.filter(recipe => 
                        recipe.author === data.username
                    ).length;
                }
            })
            .catch(error => {
                console.error("Error loading user stats:", error);
            });
        }
    },

    mounted() {
        this.load_profile();
        this.load_user_stats();
    }
};

profileApp.vue = Vue.createApp(profileApp.config).mount("#profile-app");