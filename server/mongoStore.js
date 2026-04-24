const mongoose = require('mongoose');

const sampleInternships = [
  {
    Title: 'Frontend Developer Intern',
    Company: 'NovaSoft Systems',
    Domain: 'Web Development',
    Location: 'Bengaluru',
    Stipend: 'INR 12,000/month',
    Description: 'Work on responsive pages and small UI tasks.'
  },
  {
    Title: 'Backend Developer Intern',
    Company: 'MetroPay Labs',
    Domain: 'Backend',
    Location: 'Hyderabad',
    Stipend: 'INR 15,000/month',
    Description: 'Help build APIs and simple CRUD flows.'
  },
  {
    Title: 'UI/UX Design Intern',
    Company: 'StudioPixel',
    Domain: 'UI/UX',
    Location: 'Pune',
    Stipend: 'INR 10,000/month',
    Description: 'Support wireframes, mockups, and design reviews.'
  },
  {
    Title: 'Data Analyst Intern',
    Company: 'InsightLoop',
    Domain: 'Data Analytics',
    Location: 'Remote',
    Stipend: 'INR 14,000/month',
    Description: 'Clean small datasets and prepare dashboard notes.'
  },
  {
    Title: 'Marketing Intern',
    Company: 'CampusCart',
    Domain: 'Marketing',
    Location: 'Delhi',
    Stipend: 'INR 8,000/month',
    Description: 'Assist with campaign ideas and content planning.'
  },
  {
    Title: 'Cybersecurity Intern',
    Company: 'SecureEdge',
    Domain: 'Cybersecurity',
    Location: 'Chennai',
    Stipend: 'INR 18,000/month',
    Description: 'Review basic security checks and documentation.'
  },
  {
    Title: 'DevOps Intern',
    Company: 'CloudNest',
    Domain: 'Cloud / DevOps',
    Location: 'Remote',
    Stipend: 'INR 16,000/month',
    Description: 'Support deployment steps and server monitoring.'
  },
  {
    Title: 'Product Management Intern',
    Company: 'BuildWave',
    Domain: 'Product',
    Location: 'Mumbai',
    Stipend: 'INR 11,000/month',
    Description: 'Join sprint planning and note feature feedback.'
  },
  {
    Title: 'Mobile App Intern',
    Company: 'AppOrbit',
    Domain: 'Mobile Development',
    Location: 'Bengaluru',
    Stipend: 'INR 13,000/month',
    Description: 'Work on simple Flutter / Android tasks.'
  },
  {
    Title: 'Content Writing Intern',
    Company: 'LearnMate',
    Domain: 'Content',
    Location: 'Remote',
    Stipend: 'INR 7,000/month',
    Description: 'Write short articles and help with blog updates.'
  }
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true, trim: true },
    skills: { type: String, default: '', trim: true }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const internshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    stipend: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    status: { type: String, default: 'Applied' },
    appliedDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, internshipId: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Internship = mongoose.models.Internship || mongoose.model('Internship', internshipSchema);
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toUserResponse(user) {
  return {
    UserID: String(user._id),
    Name: user.name,
    Email: user.email,
    Password: user.password,
    Skills: user.skills || '',
    CreatedAt: user.createdAt
  };
}

function toInternshipResponse(internship) {
  return {
    InternshipID: String(internship._id),
    Title: internship.title,
    Company: internship.company,
    Domain: internship.domain,
    Location: internship.location,
    Stipend: internship.stipend,
    Description: internship.description
  };
}

async function connectToDatabase(uri) {
  if (!uri) {
    throw createHttpError('Missing MONGODB_URI in environment variables', 500);
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(uri);
}

async function ensureSeedData() {
  const count = await Internship.countDocuments();
  if (count > 0) {
    return;
  }

  await Internship.insertMany(
    sampleInternships.map((item) => ({
      title: item.Title,
      company: item.Company,
      domain: item.Domain,
      location: item.Location,
      stipend: item.Stipend,
      description: item.Description
    }))
  );
}

async function listInternships() {
  const internships = await Internship.find().sort({ createdAt: 1 }).lean();
  return internships.map(toInternshipResponse);
}

async function signupUser(input) {
  const email = String(input.email || '').trim().toLowerCase();
  const name = String(input.name || '').trim();
  const password = String(input.password || '').trim();
  const skills = String(input.skills || '').trim();

  if (!name || !email || !password) {
    throw createHttpError('Name, email and password are required', 400);
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw createHttpError('Email already exists', 409);
  }

  const user = await User.create({ name, email, password, skills });
  return toUserResponse(user);
}

async function createApplication({ userId, internshipId }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw createHttpError('User not found', 404);
  }

  if (!mongoose.Types.ObjectId.isValid(internshipId)) {
    throw createHttpError('Internship not found', 404);
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    throw createHttpError('User not found', 404);
  }

  const internship = await Internship.findById(internshipId).lean();
  if (!internship) {
    throw createHttpError('Internship not found', 404);
  }

  try {
    const application = await Application.create({
      userId,
      internshipId,
      status: 'Applied',
      appliedDate: new Date()
    });

    return {
      ApplicationID: String(application._id),
      UserID: String(application.userId),
      InternshipID: String(application.internshipId),
      Status: application.status,
      AppliedDate: application.appliedDate
    };
  } catch (error) {
    if (error && error.code === 11000) {
      throw createHttpError('You already applied for this internship', 409);
    }
    throw error;
  }
}

async function getProfile(userId, filters = {}) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw createHttpError('User not found', 404);
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    throw createHttpError('User not found', 404);
  }

  const internships = await Internship.find().sort({ createdAt: 1 }).lean();

  const applications = await Application.find({ userId })
    .sort({ appliedDate: -1 })
    .populate('internshipId')
    .lean();

  const statusFilter = String(filters.status || '').trim();
  const domainFilter = String(filters.domain || '').trim();

  const enrichedApplications = applications
    .map((item) => {
      const internship = item.internshipId || {};
      return {
        ApplicationID: String(item._id),
        UserID: String(item.userId),
        InternshipID: String(internship._id || ''),
        Status: item.status,
        AppliedDate: item.appliedDate,
        Title: internship.title || '',
        Company: internship.company || '',
        Domain: internship.domain || '',
        Location: internship.location || '',
        Stipend: internship.stipend || '',
        Description: internship.description || ''
      };
    })
    .filter((item) => {
      const matchesStatus = !statusFilter || item.Status === statusFilter;
      const matchesDomain = !domainFilter || item.Domain === domainFilter;
      return matchesStatus && matchesDomain;
    });

  return {
    user: toUserResponse(user),
    internships: internships.map(toInternshipResponse),
    applications: enrichedApplications
  };
}

module.exports = {
  connectToDatabase,
  ensureSeedData,
  listInternships,
  signupUser,
  createApplication,
  getProfile
};
