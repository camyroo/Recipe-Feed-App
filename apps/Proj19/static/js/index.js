"use strict";

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

let feedApp = {};

feedApp.config = {
    data() {
        return {
            all_recipes: [],
            ingredients: [],
            db_links: [],
            db_ingredients: [],

            matched_recipes: [],
            matched_ingredients: [],
            message: "",
            filter: "recipe",
            dropdown_active: false,
            
            // Daniel - Add favorites data
            user_favorites: [],
            current_user: ""
        };

    },

    methods: {
        toggle_dropdown() {
            this.dropdown_active = !this.dropdown_active;
        },
        
        create_recipe() {
            window.location.href = `/Proj19/recipe`;
        },

        view_recipe(recipe) {
            window.location.href = `/Proj19/recipe/${recipe.id}`;
        },

        view_user_profile(username) {
            window.location.href = `/Proj19/profile/${username}`;
        },

        get_profile_picture(recipe) {
            return recipe.author_profile_picture || 'https://bulma.io/assets/images/placeholders/128x128.png';
        },

        // Daniel - Check if recipe is favorited
        is_recipe_favorited(recipe_id) {
            if (!this.user_favorites || !Array.isArray(this.user_favorites)) {
                return false;
            }
            return this.user_favorites.some(favorite => favorite.recipe_id === recipe_id);
        },

        // Daniel - Toggle favorite status
        toggle_favorite(recipe) {
            if (!this.current_user) {
                alert("Please log in to favorite recipes");
                return;
            }
            
            const is_favorited = this.is_recipe_favorited(recipe.id);
            const method = is_favorited ? "DELETE" : "POST";
            
            fetch(`/Proj19/api/favorites/${recipe.id}`, {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                if (is_favorited) {
                    // Daniel - Remove from favorites
                    this.user_favorites = this.user_favorites.filter(f => f.recipe_id !== recipe.id);
                } else {
                    // Daniel - Add to favorites
                    if (!Array.isArray(this.user_favorites)) {
                        this.user_favorites = [];
                    }
                    this.user_favorites.push({ recipe_id: recipe.id, user_id: this.current_user });
                }
            })
            .catch(error => {
                console.error('Error toggling favorite:', error);
                alert('Error updating favorites. Please try again.');
            });
        },

        search_item(type) {
            if (type === 'recipe') {
                this.matched_recipes = this.all_recipes.filter(recipe =>
                    recipe.name.toLowerCase().includes(this.message.toLowerCase())
                );
            } else if (type === 'ingredient') {
                if (!this.message.toLowerCase()) {
                    this.matched_recipes = this.all_recipes;
                    return;
                }

                this.matched_recipes = this.all_recipes.filter(recipe => {
                    let match = false;

                    this.db_links.forEach(link => {
                        if (link.recipe_id === recipe.id) {
                            this.ingredients.forEach(ingredient => {
                                if (ingredient.id === link.ingredient_id &&
                                    ingredient.name.toLowerCase().includes(this.message.toLowerCase())) {
                                   match = true;
                                }
                            });
                        }
                    });

                    return match;
                });
            }

            else if (type === 'author') {
                this.matched_recipes = this.all_recipes.filter(recipe =>
                    recipe.author.toLowerCase().includes(this.message.toLowerCase())
                );
            } else if (type === 'type') {
                this.matched_recipes = this.all_recipes.filter(recipe =>
                    recipe.type.toLowerCase().includes(this.message.toLowerCase())
                );
            }
        },

        load() {
            fetch("/Proj19/api/recipes", {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
            })
                .then(res => res.json())
                .then(data => {
                    console.log("Loaded data:", data);
                    this.all_recipes = data.recipes || [];
                    this.ingredients = data.ingredients || [];
                    this.db_links = data.links || [];
                    // Daniel - Store current user
                    this.current_user = data.username || "";

                    this.matched_recipes = data.recipes || [];
                    this.matched_ingredients = data.ingredients || [];
                    
                    // Daniel - Load user favorites after main data is loaded
                    this.load_favorites();
                })
                .catch(error => {
                    console.error('Error loading data:', error);
                    // Daniel - Set defaults on error
                    this.all_recipes = [];
                    this.ingredients = [];
                    this.db_links = [];
                    this.matched_recipes = [];
                    this.matched_ingredients = [];
                    this.user_favorites = [];
                });
        },

        // Daniel - Load user's favorites
        load_favorites() {
            if (!this.current_user) {
                this.user_favorites = [];
                return;
            }
            
            fetch("/Proj19/api/favorites", {
                method: "GET",
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                this.user_favorites = data.favorites || [];
            })
            .catch(error => {
                console.error('Error loading favorites:', error);
                this.user_favorites = [];
            });
        }
    },
}

feedApp.vue = Vue.createApp(feedApp.config).mount("#feedApp");
feedApp.vue.load();