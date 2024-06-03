
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
					<NavLink to="/displayTable/figurine" activeStyle>
						Figurine
					</NavLink>
					<NavLink to="/displayTable/games" activeStyle>
						Games
					</NavLink>
					<NavLink to="/displayTable/multigames" activeStyle>
						Multiplayer games
					</NavLink>
					<NavLink to="/visualNovel" activeStyle>
						Visual Novels
					</NavLink>
					<NavLink to="displayTable/kpop" activeStyle>
						Kpop
					</NavLink>
				</NavMenu>
			</Nav>
		</>
	);
};

export default Navbar;
