import logo from '@/assets/logo.png';

const AppHeader = () => {
  return (
    <div className="flex items-center justify-center py-3">
      <img
        src={logo}
        alt="Smarty Logbook"
        className="h-12 object-contain"
        style={{ mixBlendMode: 'multiply' }}
      />
    </div>
  );
};

export default AppHeader;
