import React from 'react'
import { Nav, Navbar } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const Menu = (/* { user } */) => {

  const padding = {
    paddingRight: 10,
  }

  return (
    <Navbar collapseOnSelect expand="lg" bg="light" variant="light">
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href="#" as="span">
            <Link style={padding} to="/">
              Home
            </Link>
          </Nav.Link>
          <Nav.Link href="#" as="span">
            <Link style={padding} to="/set-working-hours">
              Set Working Hours
            </Link>
          </Nav.Link>
          <Nav.Link href="#" as="span">
            <Link style={padding} to="/set-unavailable-hours">
              Set Available Hours
            </Link>
          </Nav.Link>
{/*           <Nav.Link href="#" as="span">
            {user ? (
              <div>
                <em style={padding}>{user.name} logged in</em>
                <Button onClick={handleLogout}>log out</Button>
              </div>
            ) : null }
          </Nav.Link> */}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export default Menu
