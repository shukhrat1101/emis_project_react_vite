import AppRouter from './routes/AppRouter';
import { ToastContainer } from 'react-toastify';

function App() {

    return (
        <>
            <ToastContainer autoClose={2000}/>
            <AppRouter/>
        </>
    )
}

export default App
