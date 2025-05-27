import { Route, BrowserRouter as Router, Routes }  from "react-router-dom"
import Home from "./Home"
import Room from "./Room";
const App = () => {
  return(
    <Router>
      <Routes>
        <Route element={<Home/>} path="/"/>
        <Route element={<Room/>} path="/room"/>
      </Routes>
    </Router>
  )
}

export default App;