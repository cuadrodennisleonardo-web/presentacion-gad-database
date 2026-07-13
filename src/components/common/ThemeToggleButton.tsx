import { useTheme } from "@/context/ThemeContext";

export const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-theme-xs hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "dark" ? (
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 15.8333C13.2217 15.8333 15.8333 13.2217 15.8333 10C15.8333 6.77834 13.2217 4.16667 10 4.16667C6.77834 4.16667 4.16667 6.77834 4.16667 10C4.16667 13.2217 6.77834 15.8333 10 15.8333Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 0.833332V2.5M10 17.5V19.1667M3.51667 3.51667L4.7 4.7M15.3 15.3L16.4833 16.4833M0.833332 10H2.5M17.5 10H19.1667M3.51667 16.4833L4.7 15.3M15.3 4.7L16.4833 3.51667"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.3611 12.6944C16.1654 13.3864 14.786 13.7778 13.3333 13.7778C8.97322 13.7778 5.55556 10.3601 5.55556 6.00001C5.55556 4.54737 5.94697 3.16795 6.63889 1.97223C3.65028 3.36507 1.66667 6.44236 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333C13.5577 18.3333 16.6349 16.3497 18.0278 13.3611C17.8148 13.4769 17.5931 13.5874 17.3611 13.6944V12.6944Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};
