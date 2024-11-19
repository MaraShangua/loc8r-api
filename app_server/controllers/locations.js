const axios = require('axios');

const apiOptions = {
    server: 'http://localhost:3000'
};
if (process.env.NODE_ENV === 'production') {
    apiOptions.server = 'https://loc8r-api-t9kv.onrender.com';
}

const homelist = async (req, res) => {
    const path = '/api/locations';
    const requestOptions = {
        url: `${apiOptions.server}${path}`,
        method: 'GET',
        params: {
            lng: 126.964062,
            lat: 37.468769,
            maxDistance: 200
        }
    };

    try {
        const { data } = await axios(requestOptions);
        const formattedData = data.length
            ? data.map((item) => {
                item.distance = formatDistance(item.distance);
                return item;
            })
            : [];
        renderHomepage(req, res, formattedData);
    } catch (error) {
        console.error('Error fetching homelist:', error.message);
        renderHomepage(req, res, []);
    }
};

const renderHomepage = (req, res, responseBody) => {
    let message = null;
    if (!(responseBody instanceof Array)) {
        message = 'API lookup error';
        responseBody = [];
    } else if (!responseBody.length) {
        message = 'No places found nearby';
    }

    res.render('locations-list', {
        title: 'Loc8r - find a place to work with wifi',
        pageHeader: {
            title: 'Loc8r',
            strapLine: 'Find places to work with wifi near you!'
        },
        sidebar:
            'Looking for wifi and a seat? Loc8r helps you find places to work when out and about. Perhaps with coffee, cake or a pint? Let Loc8r help you find the place you\'re looking for.',
        locations: responseBody,
        message
    });
};

const formatDistance = (distance) => {
    if (distance > 1000) {
        return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${Math.floor(distance)}m`;
};

const renderDetailPage = (req, res, location) => {
    res.render('location-info', {
        title: location.name,
        pageHeader: { title: location.name },
        sidebar: {
            context: 'is on Loc8r because it has accessible wifi and space to sit down with your laptop and get some work done.',
            callToAction:
                "If you've been and you like it - or if you don't - please leave a review to help other people just like you."
        },
        location
    });
};

const showError = (req, res, status) => {
    const messages = {
        404: { title: '404, page not found', content: "Oh dear. Looks like you can't find this page. Sorry." },
        default: {
            title: `${status}, something's gone wrong`,
            content: "Something, somewhere, has gone just a little bit wrong."
        }
    };
    const { title, content } = messages[status] || messages.default;

    res.status(status).render('generic-text', { title, content });
};

const renderReviewForm = (req, res, { name }) => {
    res.render('location-review-form', {
        title: `Review ${name} on Loc8r`,
        pageHeader: { title: `Review ${name}` },
        error: req.query.err
    });
};

const getLocationInfo = async (req, res, callback) => {
    const path = `/api/locations/${req.params.locationid}`;
    const requestOptions = {
        url: `${apiOptions.server}${path}`,
        method: 'GET'
    };

    try {
        const { data } = await axios(requestOptions);
        data.coords = { lng: data.coords[0], lat: data.coords[1] };
        callback(req, res, data);
    } catch (error) {
        console.error('Error fetching location info:', error.message);
        showError(req, res, error.response?.status || 500);
    }
};

const locationInfo = (req, res) => {
    getLocationInfo(req, res, (req, res, responseData) => renderDetailPage(req, res, responseData));
};

const addReview = (req, res) => {
    getLocationInfo(req, res, (req, res, responseData) => renderReviewForm(req, res, responseData));
};

const doAddReview = async (req, res) => {
    const locationid = req.params.locationid;
    const path = `/api/locations/${locationid}/reviews`;
    const postdata = {
        author: req.body.name,
        rating: parseInt(req.body.rating, 10),
        reviewText: req.body.review
    };

    if (!postdata.author || !postdata.rating || !postdata.reviewText) {
        res.redirect(`/location/${locationid}/review/new?err=val`);
        return;
    }

    const requestOptions = {
        url: `${apiOptions.server}${path}`,
        method: 'POST',
        data: postdata
    };

    try {
        const { status } = await axios(requestOptions);
        if (status === 201) {
            res.redirect(`/location/${locationid}`);
        }
    } catch (error) {
        const status = error.response?.status || 500;
        if (status === 400 && error.response.data.name === 'ValidationError') {
            res.redirect(`/location/${locationid}/review/new?err=val`);
        } else {
            showError(req, res, status);
        }
    }
};

module.exports = {
    homelist,
    locationInfo,
    addReview,
    doAddReview
};
