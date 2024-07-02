import jobModel from "../models/jobModel.js";
import employerModel from "../models/employerModel.js";

// ******CREATE JOB*******
export const createJobController = async (req, res, next) => {
    try {
        const role = req.user.role;
        if (role === 'employer' || role === 'admin') {
            const { title, jobLocation, description, preferredEducation, preferredSkill, jobType, status, industry, preferredExperience, salary } = req.body;
            if (!title || !jobLocation) {
                return next('please provide all the require field');
            }
            const newJob = new jobModel({
                title,
                jobLocation,
                description,
                preferredEducation,
                preferredSkill,
                jobType,
                status,
                industry,
                preferredExperience,
                salary,
                createdBy: req.user.userId
            });

            if (req.file) {
                // Assuming you have a field in your schema to store the resume
                newJob.companyLogoUrl = {
                    data: req.file.buffer, // Update this line to read from the file on disk
                    contentType: req.file.mimetype,
                    filename: req.file.originalname,
                    src: "http://" + req.hostname + ":8000" + "/static/" + req.file.path
                };
            }
            // const job = await jobModel.create(req.body);
            const details = await newJob.save();
            res.status(201).json({ details });

        } else {
            return next('You are not authorized to create a Job!');
        }
    } catch (error) {
        return next(error);
    }
}

// ******GET JOB FOR EMPLOYER TO SEE THEIR CREATED JOBS ONLY*******
export const getAllJobCreatedByEmployerController = async (req, res, next) => {
    try {
        const jobs = await jobModel.find({ createdBy: req.user.userId });
        res.status(200).json({
            status: true,
            totalLength: jobs.length,
            jobs
        });
    } catch (error) {
        return next(error);
    }

}


//  *********GET JOBS FOR JOBSEEKER TO VIEW *************
export const viewAllJobsController = async (req, res, next) => {
    try {

        const { status, jobType, search, sort } = req.query;
        //conditons for searching filters
        let queryObject = {};

        //logic filters
        if (status && status !== "all") {
            queryObject.status = status;
        }
        if (jobType && jobType !== "all") {
            queryObject.jobType = jobType;
        }
        if (search) {
            queryObject.title = { $regex: search, $options: "i" };
        }

        let queryResult = jobModel.find(queryObject);

        //sorting
        if (sort === "latest") {
            queryResult = queryResult.sort("-createdAt");
        }
        if (sort === "oldest") {
            queryResult = queryResult.sort("createdAt");
        }
        if (sort === "a-z") {
            queryResult = queryResult.sort("title");
        }
        if (sort === "z-a") {
            queryResult = queryResult.sort("-title");
        }
        //pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        queryResult = queryResult.skip(skip).limit(limit);
        //jobs count
        const totalJobs = await jobModel.countDocuments(queryResult);
        const numOfPage = Math.ceil(totalJobs / limit);

        const jobs = await queryResult;

        // const jobs = await jobsModel.find({ createdBy: req.user.userId });
        res.status(200).json({
            totalJobs,
            numOfPage,
            jobs,
        });

    } catch (error) {
        next(error);
    }

}


//  *********VIEW PARTICULAR JOB************
export const viewJobController = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const job = await jobModel.findById(jobId);
        if (!job) {
            next('job is not available');
        }
        console.log('job.createdBy: ', job.createdBy);
        const details = await employerModel.find({ userId: job.createdBy })
            .populate('userId', 'firstName lastName role -password')
            .select(['companyName', 'companyDescription', 'companyWebsite'])
            .exec();
        res.status(200).json({
            job,
            details
        })

    } catch (error) {
        next(error);
    }
}


// ******UPDATE JOB*******
export const updateJobController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const job = await jobModel.findOne({ _id: id });
        if (!job) {
            return res.status(404).json({ error: `No Job with the id of ${id}` });
        }
        if (!(req.user.userId === job.createdBy.toString())) {
            return res.status(403).json({ error: 'You are not authorized to update this job' });
        }

        // Update only the fields that are present in the request body
        for (const key in updates) {
            if (Object.prototype.hasOwnProperty.call(updates, key)) {
                job[key] = updates[key];
            }
        }

        const updateJob = await job.save();

        res.status(200).json({
            status: true,
            updateJob
        });

    } catch (error) {
        return next(error);
    }
}


// ******DELETE JOB*******
export const deleteJobController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const job = await jobModel.findOne({ _id: id });
        if (!job) {
            return next(`No Job with the id of ${id}`);
        }
        if (!(req.user.userId === job.createdBy.toString())) {
            return next('you are not authorized to update this job')
        }
        await job.deleteOne();
        res.status(200).json({
            status: true,
            message: "Job Deleted successfully"
        })
    } catch (error) {
        next(error);
    }

}