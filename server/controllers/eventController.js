import Event from '../models/Event.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse, paginate } from '../utils/helpers.js';

/**
 * Get all events
 * GET /api/events
 */
export const getEvents = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { category, upcoming } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (upcoming === 'true') filter.date = { $gte: new Date() };

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'name avatar')
        .populate('club', 'name icon color')
        .skip(skip)
        .limit(limit)
        .sort({ date: 1 }),
      Event.countDocuments(filter),
    ]);

    res.status(200).json(
      formatResponse(
        { events, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Events retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby events based on coordinates
 * GET /api/events/nearby
 */
export const getNearbyEvents = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      throw ApiError.badRequest('Latitude and longitude are required.');
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Approximate degree-to-km conversion
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(latNum * (Math.PI / 180)));

    const events = await Event.find({
      date: { $gte: new Date() },
      'coordinates.lat': { $gte: latNum - latDelta, $lte: latNum + latDelta },
      'coordinates.lng': { $gte: lngNum - lngDelta, $lte: lngNum + lngDelta },
    })
      .populate('organizer', 'name avatar')
      .populate('club', 'name icon color')
      .sort({ date: 1 })
      .limit(20);

    res.status(200).json(formatResponse({ events }, 'Nearby events retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Create an event
 * POST /api/events
 */
export const createEvent = async (req, res, next) => {
  try {
    const { title, description, date, location, coordinates, club, category } = req.body;

    const image = req.file ? `/uploads/posts/${req.file.filename}` : '';

    const event = await Event.create({
      title,
      description: description || '',
      date,
      location,
      coordinates: coordinates || { lat: 0, lng: 0 },
      organizer: req.user._id,
      club: club || null,
      image,
      category: category || 'other',
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name avatar')
      .populate('club', 'name icon color');

    res.status(201).json(formatResponse({ event: populatedEvent }, 'Event created successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle attend an event
 * POST /api/events/:id/attend
 */
export const attendEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    const userId = req.user._id;
    const attendeeIndex = event.attendees.findIndex(
      (id) => id.toString() === userId.toString()
    );

    let attending;
    if (attendeeIndex > -1) {
      event.attendees.splice(attendeeIndex, 1);
      attending = false;
    } else {
      event.attendees.push(userId);
      attending = true;
    }

    await event.save();

    res.status(200).json(
      formatResponse(
        { attending, attendeeCount: event.attendees.length },
        attending ? 'RSVP confirmed.' : 'RSVP cancelled.'
      )
    );
  } catch (error) {
    next(error);
  }
};
