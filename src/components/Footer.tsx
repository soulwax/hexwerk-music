// File: src/components/Footer.tsx

export default function Footer() {
    return (
        <footer className="w-full py-4 bg-gray-900 border-t border-gray-800 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Starchild Music. All rights reserved. For a full license, visit https://starchildmusic.com/license
        </footer>
    );
}