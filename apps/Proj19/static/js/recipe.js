"use strict";

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

let recipeApp = {};

recipeApp.empty_ingredient = {
    name: "",
    unit: null,
    calories_per_unit: null,
    description: "",
    cholesterol: null,
    sodium: null,
    total_carbohydrate: null,
    protein: null
};

recipeApp.empty_recipe = {
    name: "",
    type: "",
    description: "",
    author: "",
    instruction_steps: "",
    servings: 0
};

recipeApp.empty_link = {
    recipe_id: 0,
    ingredient_id: 0,
    quantity_per_serving: 0
}

recipeApp.config = {
    data() {
        return {
            error_message: "",
            current_user: "",
            is_favorite: false,  // Track if recipe is favorited

            edit_mode: start_edit_mode,
            author: false,
            show_IM: false,

            local_ingredients: [], // ingredients saved on this recipe locally 
            db_ingredients: [],      // ingredients fetched from db

            local_links: [],
            db_links: [],
            matched_ingredients: [], // search results

            new_recipe: clone(recipeApp.empty_recipe),
            new_ingredient: clone(recipeApp.empty_ingredient),
            new_link: clone(recipeApp.empty_link),

            recipes: [],
            recipe_calories: null,
            display_servings: 1, // for scaling
            selected_file: null, // Only allow one image for preview, like profile
            temp_image_preview: '',
            recipe_images: [],
            temp_images: [], // Store base64 images selected before recipe creation
        };
    },

    mounted() {
        // Set display_servings to the recipe's servings when loaded
        this.$nextTick(() => {
            if (this.new_recipe && this.new_recipe.servings > 0) {
                this.display_servings = this.new_recipe.servings;
            }
            
            // Load recipe images when viewing an existing recipe
            if (recipe_id && !this.edit_mode) {
                this.load_recipe_images();
            }
        });
    },

    // -- Pratyush
    //to sync recipe servings
    // whenever new_recipe.servings changes (on load or after PUT), display_servings will auto reset
    watch: {
        'new_recipe.servings'(val) {
            this.display_servings = val > 0 ? val : 1;
        }
    },

    computed: {
        all_links() {
            const seen = new Set();
            return [...this.db_links, ...this.local_links]
                .filter(l => l.ingredient_id)
                .filter(l => {
                    if (seen.has(l.ingredient_id)) return false;
                    seen.add(l.ingredient_id);
                    return true;
                });
        },

        // helper for scaling per-serving numbers
        scaled_nutrition() {
            // if calories haven't been fetched yet, return null
            if (!this.recipe_calories) return null;

            const s = this.display_servings; // what user types
            const p = this.recipe_calories; // api data
            const mul = (x) => Math.round(x * s);

            return {
                calories_per_serving : p.calories_per_serving,
                total_calories : mul(p.calories_per_serving),

                chol_per_serving : p.chol_per_serving,
                total_chol : mul(p.chol_per_serving),

                sodium_per_serving  : p.sodium_per_serving,
                total_sodium  : mul(p.sodium_per_serving),

                carbs_per_serving  : p.carbs_per_serving,
                total_carbs  : mul(p.carbs_per_serving),

                protein_per_serving  : p.protein_per_serving,
                total_protein  : mul(p.protein_per_serving),
            };
        },
    },

    methods: {
        toggle_edit_mode() {
            this.edit_mode = !this.edit_mode;
        },

        toggle_IM() {
            this.show_IM = !this.show_IM;
        },

        delete_recipe() {
            console.log("delete")
        },

        add_ingredient() {
            if (this.new_ingredient.name.length > 1) {
                let ingredient = clone(this.new_ingredient);
                this.local_ingredients.push(ingredient); // push from manual add
                this.new_ingredient = clone(recipeApp.empty_ingredient);

                fetch("/Proj19/api/ingredients", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ingredient)
                })
                    .then(res => res.json())
                    .then(res => {
                        if (res.errors && Object.keys(res.errors).length > 0) {
                            this.error_message = JSON.stringify(res.errors);
                        } else {
                            ingredient.id = res.id; //use this later for the linking table
                            this.local_ingredients.push(ingredient);

                            let link = clone(this.new_link);
                            link.ingredient_id = res.id;

                            this.local_links.push(link);
                            
                            console.log("res ingredient id: " + res.id)
                            this.load();
                        }
                    });
            }
        },

        add_recipe() {
            if (this.new_recipe.name.length > 1) {
                this.new_recipe.author = this.current_user;
                let recipe = clone(this.new_recipe);
                this.recipes.push(recipe);
                this.new_recipe = clone(recipeApp.empty_recipe);

                fetch("/Proj19/api/recipes", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recipe)
                })
                    .then(res => res.json())
                    .then(res => {
                        if (res.errors && Object.keys(res.errors).length > 0) {
                            this.error_message = JSON.stringify(res.errors);
                        }
                        else {
                            const recipe_id = res.id;
                            this.local_links.forEach(link => { link.recipe_id = res.id; this.add_link(link) })
                            this.local_links.forEach(link => console.log("Link:" + link.recipe_id + " " + link.ingredient_id + " " + link.quantity_per_serving));
                            // Upload any queued images now that we have a recipe_id
                            if (this.temp_images.length > 0) {
                                Promise.all(this.temp_images.map(imageData =>
                                    fetch('/Proj19/api/recipe_image', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            recipe_id: recipe_id,
                                            image: imageData
                                        })
                                    })
                                )).then(() => {
                                    this.temp_images = [];
                                    window.location.href = `/Proj19/recipe/${recipe_id}`;
                                });
                            } else {
                                window.location.href = `/Proj19/recipe/${recipe_id}`;
                            }
                        }
                    })
            }
        },
        load_calories() { // to show total calories on recipe page --pratyush
            if (recipe_id) {
                fetch(`/Proj19/api/recipe_calories/${recipe_id}`)
                    .then(res => res.json())
                    .then(data => {
                        this.recipe_calories = data;
                    });
            }
        },

        add_link(lin) {
            if (lin.recipe_id !== 0 && lin.ingredient_id !== 0) {
                let link = clone(lin);

                fetch("/Proj19/api/links", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(link)
                })
                    .then(res => res.json())
                    .then(res => {
                        if (res.errors && Object.keys(res.errors).length > 0) {
                            this.error_message = JSON.stringify(res.errors);
                        } else {
                            link.id = res.id;
                            this.db_links.push(link);
                        }
                    });
            }
        },

        edit_recipe() {
            let recipe = clone(this.new_recipe);

            fetch(`/Proj19/api/recipes/${this.new_recipe.id}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recipe)
            })
                .then(res => res.json())
                .then(res => {
                    if (res.errors && Object.keys(res.errors).length > 0) {
                        //console.log("something happened!");
                        this.error_message = JSON.stringify(res.errors);
                    }
                    else {
                        console.log("recipe inserted!");
                        // recipe.id = res.id;
                        console.log("recipe id" + res.id)
                        this.local_links.forEach(link => { link.recipe_id = recipe.id; this.add_link(link); });
                        this.edit_mode = false
                        this.local_links = [];
                    }
                })
        },

        store_ingredient() {
            let ingredient = clone(this.new_ingredient); // push from search bar add 
            this.local_ingredients.push(ingredient);

            let link = clone(this.new_link)
            link.ingredient_id = this.new_ingredient.id;

            this.local_links.push(link)

            this.local_ingredients.forEach(ingredient => console.log(ingredient.name));
            this.db_links.forEach(link => console.log("Link:" + link.recipe_id + " " + link.ingredient_id + " " + link.quantity_per_serving));
        },

        get_ingredient_name_by_id(id) {
            let name = "";
            this.db_ingredients.forEach(ingredient => {
                if (ingredient.id === id) {
                    name = ingredient.name;
                }
            });
            return name;
        },

        save_recipe() {
            if (this.new_recipe.id) {
                // Editing existing recipe
                this.edit_recipe();
                
                // Upload image if one was selected
                if (this.temp_image_preview) {
                    fetch('/Proj19/api/recipe_image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipe_id: this.new_recipe.id,
                            image: this.temp_image_preview  // base64 string
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            this.load_recipe_images();
                            this.selected_file = null;
                            this.temp_image_preview = '';
                        }
                    });
                }
            } else {
                // Creating new recipe
                if (this.new_recipe.name.length > 1) {
                    this.new_recipe.author = this.current_user;
                    let recipe = clone(this.new_recipe);

                    fetch("/Proj19/api/recipes", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(recipe)
                    })
                    .then(res => res.json())
                    .then(res => {
                        if (res.errors && Object.keys(res.errors).length > 0) {
                            this.error_message = JSON.stringify(res.errors);
                        } else {
                            const recipe_id = res.id;
                            
                            // Add links
                            this.local_links.forEach(link => { 
                                link.recipe_id = res.id; 
                                this.add_link(link) 
                            });
                            
                            // Upload image if one was selected
                            if (this.temp_image_preview) {
                                fetch('/Proj19/api/recipe_image', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        recipe_id: recipe_id,
                                        image: this.temp_image_preview  // base64 string
                                    })
                                })
                                .then(() => {
                                    this.selected_file = null;
                                    this.temp_image_preview = '';
                                    // Redirect to view the new recipe
                                    window.location.href = `/Proj19/recipe/${recipe_id}`;
                                });
                            } else {
                                // No image, just redirect
                                window.location.href = `/Proj19/recipe/${recipe_id}`;
                            }
                        }
                    });
                }
            }
        },

        search_ingredient() {
            this.matched_ingredients = this.db_ingredients.filter(ingredient =>
                ingredient.name.toLowerCase().includes(this.new_ingredient.name.toLowerCase())
            );

            //this.matched_ingredients.forEach(ingredient => console.log(ingredient.name));
        },

        selectIngredient(ingredient) {
            this.new_ingredient.name = ingredient.name;
            this.new_ingredient.id = ingredient.id
        },

        load() { // this retrieves the data from the recipe to populate the form
            fetch("/Proj19/api/recipes", {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
            })
                .then(res => res.json())
                .then(data => {
                    this.db_ingredients = data.ingredients;
                    this.recipes = data.recipes;
                    this.current_user = data.username;

                    if (recipe_id) {
                        fetch(`/Proj19/api/recipe_by_id/${recipe_id}`, {
                            method: "GET",
                            headers: { 'Content-Type': 'application/json' }
                        })
                            .then(res => res.json())
                            .then(data => {
                                this.new_recipe = data.recipe;
                                this.display_servings = this.new_recipe.servings > 0
                                ? this.new_recipe.servings: 1;
                                this.author = data.recipe.author === this.current_user;
                                this.check_favorite_status();
                                this.load_recipe_images(); // Always fetch images after loading recipe
                            });

                        fetch(`/Proj19/api/links_by_recipe/${recipe_id}`, {
                            method: "GET",
                            headers: { 'Content-Type': 'application/json' },
                        })
                            .then(res => res.json())
                            .then(data => {
                                this.db_links = data.links;
                            });
                        this.load_calories();
                    }
                });
        },

        scale_quantity(qty) {
            // Scale by display_servings vs. recipe.servings
            return (qty * this.display_servings).toFixed(2);
        },

        toggle_favorite() {
            if (!this.current_user) {
                alert("Please log in to favorite recipes");
                return;
            }
            
            const method = this.is_favorite ? "DELETE" : "POST";
            fetch(`/Proj19/api/favorites/${this.new_recipe.id}`, {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                this.is_favorite = !this.is_favorite;
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },

        check_favorite_status() {
            if (!this.current_user || !this.new_recipe.id) return;
            
            fetch("/Proj19/api/favorites", {
                method: "GET",
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                this.is_favorite = data.favorites.some(f => f.recipe_id === this.new_recipe.id);
            })
            .catch(error => {
                console.error('Error:', error);
            });
        },

        // Image upload methods
        triggerFileInput() {
            this.$refs.fileInput.click();
        },

        handle_recipe_image_selection(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (this.new_recipe.id) {
                        // If recipe exists, upload immediately
                        fetch('/Proj19/api/recipe_image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                recipe_id: this.new_recipe.id,
                                image: e.target.result
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                this.load_recipe_images();
                            }
                        });
                    } else {
                        // If recipe does not exist yet, queue the image
                        this.temp_images.push(e.target.result);
                    }
                };
                reader.readAsDataURL(file);
            }
            event.target.value = '';
            this.selected_file = null;
            this.temp_image_preview = '';
        },

        load_recipe_images() {
            if (!this.new_recipe.id) return;
            
            fetch(`/Proj19/api/recipe_images/${this.new_recipe.id}`)
                .then(res => res.json())
                .then(images => {
                    this.recipe_images = Array.isArray(images) ? images : [];
                })
                .catch(error => {
                    console.error('Error loading recipe images:', error);
                    this.recipe_images = [];
                });
        },

        delete_recipe_image(image_id) {
            if (!confirm("Are you sure you want to delete this image?")) return;
            fetch(`/Proj19/api/recipe_image/${image_id}`, {
                method: "DELETE",
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    this.load_recipe_images();
                } else {
                    alert(data.error || "Failed to delete image.");
                }
            });
        },
    }
};

recipeApp.vue = Vue.createApp(recipeApp.config).mount("#recipe-app");
recipeApp.vue.load();