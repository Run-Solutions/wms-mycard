import React from 'react';
import Notifications from './components/Notification/Notification';
import AuthFlipCard from './components/Auth/AuthFlipCard';
import { ToastContainer } from 'react-toastify';

const App: React.FC = () => {
  return (
    <>
      <ToastContainer position="top-center" theme="light" />
      <Notifications />
      <AuthFlipCard />
    </>
  );
};

export default App;