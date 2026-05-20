import Club from '../models/Club.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse, paginate } from '../utils/helpers.js';

/**
 * Get all clubs
 * GET /api/clubs
 */
export const getClubs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { search } = req.query;

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const [clubs, total] = await Promise.all([
      Club.find(filter)
        .populate('admin', 'name avatar')
        .skip(skip)
        .limit(limit)
        .sort({ memberCount: -1 }),
      Club.countDocuments(filter),
    ]);

    res.status(200).json(
      formatResponse(
        { clubs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Clubs retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get club by ID
 * GET /api/clubs/:id
 */
export const getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('admin', 'name avatar email')
      .populate('members', 'name avatar');

    if (!club) {
      throw ApiError.notFound('Club not found.');
    }

    res.status(200).json(formatResponse({ club }, 'Club retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Create a club
 * POST /api/clubs
 */
export const createClub = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;

    const club = await Club.create({
      name,
      description: description || '',
      icon: icon || undefined,
      color: color || undefined,
      admin: req.user._id,
      members: [req.user._id],
      memberCount: 1,
    });

    // Add club to user's joinedClubs
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedClubs: club._id },
    });

    const populatedClub = await Club.findById(club._id)
      .populate('admin', 'name avatar')
      .populate('members', 'name avatar');

    res.status(201).json(formatResponse({ club: populatedClub }, 'Club created successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle join/leave a club
 * POST /api/clubs/:id/toggle-join
 */
export const toggleJoinClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      throw ApiError.notFound('Club not found.');
    }

    const userId = req.user._id;
    const memberIndex = club.members.findIndex(
      (id) => id.toString() === userId.toString()
    );

    let joined;
    if (memberIndex > -1) {
      // Cannot leave if you are the admin
      if (club.admin.toString() === userId.toString()) {
        throw ApiError.badRequest('Club admin cannot leave the club. Transfer admin role first.');
      }
      club.members.splice(memberIndex, 1);
      club.memberCount = Math.max(0, club.memberCount - 1);
      joined = false;

      await User.findByIdAndUpdate(userId, {
        $pull: { joinedClubs: club._id },
      });
    } else {
      club.members.push(userId);
      club.memberCount += 1;
      joined = true;

      await User.findByIdAndUpdate(userId, {
        $addToSet: { joinedClubs: club._id },
      });
    }

    await club.save();

    res.status(200).json(
      formatResponse(
        { joined, memberCount: club.memberCount },
        joined ? 'Joined club successfully.' : 'Left club successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};
