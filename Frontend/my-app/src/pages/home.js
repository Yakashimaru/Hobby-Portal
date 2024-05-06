import React from 'react';

const Home = () => {
    return (
        <div className="home-container">
            <h1>Welcome to My App</h1>
            <p>This is a simple web application built with React.</p>
            <p>Feel free to explore different features and functionalities!</p>
            <div className="cta-buttons">
                <button className="primary-button">Get Started</button>
                <button className="secondary-button">Learn More</button>
            </div>
        </div>
    );
}

export default Home;
