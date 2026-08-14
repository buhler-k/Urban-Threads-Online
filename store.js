import { db, auth } from "./firebase.js";
import { collection, getDocs, doc, setDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


let currentUser= null;
let cartItems = [];

const productsGrid = document.getElementById("products-grid");
const cartContainer = document.getElementById("cart-items");
const cartCount =document.getElementById("total-amount");
const checkoutBtn = document.getElementById("checkout-btn");
const authBtn = document.getElementById("auth-btn");
const loginLink = document.querySelector('.right-icons a[href="login.html"]');
const loginIcon = loginLink ? loginLink.querySelector(".material-symbols-outlined") : null;
const loginTooltip = document.getElementById("login-tooltip"); 



window.navigateToCategory = (categoryName) => {
    window.location.href = `shop.html?category=${encodeURIComponent(categoryName)}`;
}

onAuthStateChanged(auth, async(user) => {
    if (user) {
        currentUser = user;
        if (loginIcon) loginIcon.textContent = "account_circle";
        if (loginTooltip) loginTooltip.textContent = user.email;
        await loadUserCart();
    } else {
        currentUser = null;
        cartItems = [];
        if (loginIcon) loginIcon.textContent = "person";
        if (loginTooltip) loginTooltip.textContent = "Login";
        if (window.location.pathname.includes("cart.html")) {
            alert("Please log in to view your shopping cart.");
            window.location.href = "login.html";
        }
    }

    if (productsGrid) {
        fetchProducts();
    }
    if (cartContainer) renderCartUI();
});

    async function fetchProducts() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const selectedCategory = urlParams.get("category");

            let productsQuery;
            const productsCollectionRef = collection(db, "products");

            if(selectedCategory) {
                const formattedCategory = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
                productsQuery = query(productsCollectionRef, where("category", "==", formattedCategory));

            } else {
                productsQuery = productsCollectionRef;
            }

            const querySnapshot = await getDocs(productsQuery);
            productsGrid.innerHTML = "";

            if (querySnapshot.empty) {
                productsGrid.innerHTML = `<p class="empty-msg">No products found under this category</p>`;
                return;
            }

            querySnapshot.forEach((productDoc) => {
                const product = productDoc.data();
                productsGrid.innerHTML += `
                <div class="store-product-card">
                    <div class="product-img-wrapper">
                        <img src = "${product.imageURL || "./ASSETS/placeholder.jpg"}" alt="${product.name || "Product"}">
                    </div>
                    <div class="product-details">
                        <h3>${product.name || "No Name" }</h3>
                        <p class="product-desc">${product.description || "No description provided"}</p>
                        <span class="product-price">R${typeof product.price ==="number" ? product.price.toFixed(2) : product.price} </span>
                        <button class="add-to-cart-btn" data-id="${productDoc.id}"
                            data-name="${product.name}"
                            data-price="${product.price}"
                            data-image="${product.imageURL || "./ASSETS/placeholder.jpg"}">
                            Add to Cart
                        </button>
                    </div>

                </div>`;
            });

            document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-id");
                const name = e.target.getAttribute("data-name");
                const price = parseFloat(e.target.getAttribute("data-price"));
                const image = e.target.getAttribute("data-image");
                handleAddToCart(id, name, price, image);
            });
        });

        
        } catch (error) {
        console.error("Error drawing products catalog layout", error);
        }
    }

    async function handleAddToCart(id, name, price, image) {
        if (!currentUser) {
            alert("You must log in to start shopping!");
            window.location.href="login.html";
            return;
        }
        const existingProduct = cartItems.find(item => item.id === id);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cartItems.push({ id, name, price, image, quantity: 1 });
        }

        await saveUserCart();
        // alert(`${name} added to cart!`);
    }

    async function saveUserCart() {
        if (!currentUser) return;
        try {
            const userCartRef = doc(db,"carts", currentUser.uid);
            await setDoc(userCartRef, { items: cartItems });
            if (cartContainer) renderCartUI();
        } catch (error) {
            console.error("failed saving checkout", error);
        }

    }
    async function loadUserCart() {
        if (!currentUser) 
            return;
        try{
            const userCartRef = doc(db, "carts", currentUser.uid);
            const cartSnap = await getDoc(userCartRef);

            if (cartSnap && cartSnap.exists()) {
                cartItems = cartSnap.data().items || [];
            } else {
                cartItems = [];
            }
            if (cartContainer) renderCartUI();
        } catch (error) {
            console.error("Error reading cart", error);
        }
    }
    function renderCartUI() {
        if (!cartContainer) return;
        cartContainer.innerHTML = ""; 
        let rollingTotal = 0;

        if (cartItems.length===0){
            cartContainer.innerHTML = `<p class="empty-msg">Your Lux Basket is currently empty!</p>`;
            if (cartCount) cartCount.textContent = "0.00";
            return;
        }

        cartItems.forEach((item, index) => {
            const costSum = item.price * item.quantity;
            rollingTotal += costSum;

            cartContainer.innerHTML += `
            <div class="cart-row" style="display: flex; align-items: center; margin-bottom: 55px;">
                <img src="${item.image || "./ASSETS/placeholder.jpg"}" style="width:60px; height: 65px; object-fit: cover; margin-right: 15px; border-radius: 4px;">

                <div class="cart-item-info" style="flex-grow: 1;" >
                    <h4>${item.name}</h4>
                    <p>R${item.price.toFixed(2)} x ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <span class="subtotal" style="font-weight: bold;"> R${costSum.toFixed(2)}</span>
                    <button class="remove-btn" data-index = "${index}" style="background-color: black; color: white; cursor: pointer;">Remove</button>
                </div>
            </div>`;
        });

        if (cartCount) cartCount.textContent = rollingTotal.toFixed(2);

        document.querySelectorAll(".remove-btn").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                const indexToRemove = parseInt(e.target.getAttribute("data-index"), 10);
                cartItems.splice(indexToRemove, 1);
                await saveUserCart();
            });
        });

        if (typeof authBtn !== "undefined" && authBtn) {
            authBtn.addEventListener("click", () => {
                if (currentUser) {
                    signOut(auth).then(() => {
                        alert("signed out!");
                        window.location.href = "index.html";
                    });
                } else {
                    window.location.href = "login.html";
                }
            });
        }

        if (typeof checkoutBtn !== "undefined" && checkoutBtn) {
            checkoutBtn.addEventListener("click", () => {
                if (cartItems.length === 0) {
                    alert("Your Lux Basket is empty!");
                    return;
                }
                alert("Your Order has Been Successfully Placed!");
            });
        }
    }
