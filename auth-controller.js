import { auth } from "../firebase.js";

import { signInWithEmailAndPassword, createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value;

        if(!email || !password) {
            alert("Please fill in all field.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email,password);
            alert("Account create successfully! Welcome to Urban Threads");
            window.location.href ="index.html";
        }
        catch(error){
            console.error("Regostration failed:", error);
            alert(`Error: ${error.message}`);
        }
    });
}

if (loginForm){
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("user-password").value.trim();
        const password = document.getElementById("user-password").value;

        if(!email || !password){
            alert("Please fill in all fields");
            return;
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            alert("Logged in successfully !");
            window.location.href = "index.html";

        } catch (error) {
            console.error("Login failed: ", error);
            alert(`Error: ${error.message}`);
        }
    });
}