const waitForRandomTime = async () => {
    await new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * 2000) + 1000)
    );
};

module.exports = {
    waitForRandomTime,
};
