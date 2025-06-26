// Daniel - Favorites Page Vue.js Application
"use strict";

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

let favoritesApp = {};

favoritesApp.config = {
    data() {
        return {
            favorite_recipes: [],
            all_recipes: [],
            user_favorites: [],
            filtered_recipes: [],
            search_message: "",
            loading: true,
            current_user: ""
        };
    },

    methods: {
        view_recipe(recipe) {
            window.location.href = `/Proj19/recipe/${recipe.id}`;
        },

        view_user_profile(username) {
            window.location.href = `/Proj19/profile/${username}`;
        },

        get_profile_picture(recipe) {
            return recipe.author_profile_picture || 'https://bulma.io/assets/images/placeholders/128x128.png';
        },

        // Daniel - Remove recipe from favorites
        remove_from_favorites(recipe) {
            fetch(`/Proj19/api/favorites/${recipe.id}`, {
                method: "DELETE",
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                // Daniel - Remove from local arrays
                this.favorite_recipes = this.favorite_recipes.filter(r => r.id !== recipe.id);
                this.filtered_recipes = this.filtered_recipes.filter(r => r.id !== recipe.id);
                this.user_favorites = this.user_favorites.filter(f => f.recipe_id !== recipe.id);
            })
            .catch(error => {
                console.error('Error removing favorite:', error);
            });
        },

        // Daniel - Search through favorite recipes
        search_favorites() {
            if (!this.search_message.toLowerCase()) {
                this.filtered_recipes = this.favorite_recipes;
                return;
            }

            this.filtered_recipes = this.favorite_recipes.filter(recipe =>
                recipe.name.toLowerCase().includes(this.search_message.toLowerCase()) ||
                recipe.author.toLowerCase().includes(this.search_message.toLowerCase()) ||
                recipe.type.toLowerCase().includes(this.search_message.toLowerCase()) ||
                recipe.description.toLowerCase().includes(this.search_message.toLowerCase())
            );
        },

        // Daniel - Clear search and show all favorites
        clear_search() {
            this.search_message = "";
            this.filtered_recipes = this.favorite_recipes;
        },

        // Daniel - Load user's favorite recipes
        load() {
            this.loading = true;
            
            // Daniel - First get all recipes and user info
            fetch("/Proj19/api/recipes", {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
            })
            .then(res => res.json())
            .then(data => {
                this.all_recipes = data.recipes;
                this.current_user = data.username;
                
                // Daniel - Then get user's favorites
                return fetch("/Proj19/api/favorites", {
                    method: "GET",
                    headers: { 'Content-Type': 'application/json' }
                });
            })
            .then(res => res.json())
            .then(data => {
                this.user_favorites = data.favorites;
                
                // Daniel - Filter recipes to only show favorites
                this.favorite_recipes = this.all_recipes.filter(recipe => 
                    this.user_favorites.some(favorite => favorite.recipe_id === recipe.id)
                );
                
                this.filtered_recipes = this.favorite_recipes;
                this.loading = false;
            })
            .catch(error => {
                console.error('Error loading favorites:', error);
                this.loading = false;
            });
        }
    },

    mounted() {
        this.load();
    }
};

favoritesApp.vue = Vue.createApp(favoritesApp.config).mount("#favoritesApp");