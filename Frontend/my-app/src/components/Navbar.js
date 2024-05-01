
import React from "react";
import { Nav, NavLink, NavMenu } from "./NavbarElements";

const Navbar = () => {
	return (
		<>
			<Nav>
				<NavMenu>
					<NavLink to="/Home" activeStyle>
						Home
					</NavLink>
					<NavLink to="/Table" activeStyle>
						Figurine
					</NavLink>
					<NavLink to="/" activeStyle>
						Games
					</NavLink>
					<NavLink to="/sign-up" activeStyle>
						Multiplayer games
					</NavLink>
					<NavLink to="/vn" activeStyle>
						Visual Novels
					</NavLink>
					<NavLink to="/sign-up" activeStyle>
						Kpop
					</NavLink>
				</NavMenu>
			</Nav>
		</>
	);
};

export default Navbar;
