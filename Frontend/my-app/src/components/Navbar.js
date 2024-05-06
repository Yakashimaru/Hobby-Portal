
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
					<NavLink to="/displayTable/Figurine" activeStyle>
						Figurine
					</NavLink>
					<NavLink to="/displayTable/Games" activeStyle>
						Games
					</NavLink>
					<NavLink to="/displayTable/Multigames" activeStyle>
						Multiplayer games
					</NavLink>
					<NavLink to="/displayTable/VisualNovel" activeStyle>
						Visual Novels
					</NavLink>
					<NavLink to="displayTable/Kpop" activeStyle>
						Kpop
					</NavLink>
				</NavMenu>
			</Nav>
		</>
	);
};

export default Navbar;
