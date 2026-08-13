console.log("Auth loaded");
import { auth } from "../firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signing-up-form");

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

            await sendEmailVerification(userCredential.user);
            alert("Your Lux account has been successfully created! Please check for a verification email.");
            await auth.signOut();
            window.location.href="login.html";
        
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

        const email = document.getElementById("user-email").value.trim();
        const password = document.getElementById("user-password").value;

        if(!email || !password){
            alert("Please fill in all fields");
            return;
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            if (!userCredential.user.emailVerified) {
                alert("Your email is not yet verified.Please check for a verification email on your inbox.");
                await auth.signOut();
                return;
            }

            alert("Logged in successfully!");
            window.location.href="index.html";
        }
        catch (error) {
            console.log("Login failed: ", error);
            alert(`Error: ${error.message}`);
        }
    });
}