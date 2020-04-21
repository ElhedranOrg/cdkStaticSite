import * as React from 'react';

import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { PageOne } from './components/PageOne';
import { PageTwo } from './components/PageTwo';

export const App = () => (
    <Router>
        <h1>app</h1>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/one">One</Link>
            </li>
            <li>
              <Link to="/two">Two</Link>
            </li>
          </ul>
        </nav>
        <Switch>
            <Route path="/one"><PageOne/></Route>
            <Route path="/two"><PageTwo/></Route>
        </Switch>

    </Router>
);
