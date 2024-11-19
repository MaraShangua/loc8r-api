const homelist = (req, res) => {
    const path = '/api/locations';
    const requestOptions = {
        url: `${apiOptions.server}${path}`,
        method: 'GET',
        json: {},
        qs: {
            lng: 126.964062,
            lat: 37.468769,
            maxDistance: 200,
        },
    };

    request(requestOptions, (err, response, body) => {
        if (err) {
            console.error('Request error:', err);
            return showError(req, res, 500);
        }

        const { statusCode } = response || {};
        if (!statusCode) {
            console.error('No response or statusCode');
            return showError(req, res, 500);
        }

        let data = [];
        if (statusCode === 200 && Array.isArray(body) && body.length) {
            data = body.map((item) => {
                item.distance = formatDistance(item.distance);
                return item;
            });
        }

        renderHomepage(req, res, data);
    });
};

const getLocationInfo = (req, res, callback) => {
    const path = `/api/locations/${req.params.locationid}`;
    const requestOptions = {
        url: `${apiOptions.server}${path}`,
        method: 'GET',
        json: {},
    };

    request(requestOptions, (err, response, body) => {
        if (err) {
            console.error('Request error:', err);
            return showError(req, res, 500);
        }

        const { statusCode } = response || {};
        if (!statusCode) {
            console.error('No response or statusCode');
            return showError(req, res, 500);
        }

        let data = body;
        if (statusCode === 200) {
            data.coords = {
                lng: body.coords[0],
                lat: body.coords[1],
            };
            callback(req, res, data);
        } else {
            showError(req, res, statusCode);
        }
    });
};

const doAddReview = (req, res) => {
    const locationid = req.params.locationid;
    const path = `/api/locations/${locationid}/reviews`;
    const postdata = {
        author: req.body.name,
        rating: parseInt(req.body.rating, 10),
        reviewText: req.body.review,
    };

    const requestOptions = {
        url: `${apiOptions.server}${path}`,
        method: 'POST',
        json: postdata,
    };

    if (!postdata.author || !postdata.rating || !postdata.reviewText) {
        return res.redirect(`/location/${locationid}/review/new?err=val`);
    }

    request(requestOptions, (err, response, body) => {
        if (err) {
            console.error('Request error:', err);
            return showError(req, res, 500);
        }

        const { statusCode } = response || {};
        if (!statusCode) {
            console.error('No response or statusCode');
            return showError(req, res, 500);
        }

        if (statusCode === 201) {
            res.redirect(`/location/${locationid}`);
        } else if (statusCode === 400 && body && body.name === 'ValidationError') {
            res.redirect(`/location/${locationid}/review/new?err=val`);
        } else {
            showError(req, res, statusCode);
        }
    });
};
