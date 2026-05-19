import './globals.css';
import NavBar from '../components/NavBar';

export const metadata = {
  title: 'Prowider',
  description: 'Lead management and provider assignment system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
