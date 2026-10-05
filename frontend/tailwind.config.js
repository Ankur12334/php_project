export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#f2f7ff',
          100: '#d9e8ff',
          600: '#155eef',
          700: '#1447e6'
        }
      },
      boxShadow: {
        card: '0 14px 32px -22px rgba(9, 30, 66, 0.45)',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }
    }
  },
  plugins: []
};
