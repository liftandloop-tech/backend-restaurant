
  import Feedback from '../models/feedback.js'
   
   export const submitfeedback = async (req, res) => {
    try{ 
        const {customerName, rating ,comment, category,customerId} =req.body

        if(!customerName || !rating || comment || category || customerId){
            return res.status(400).json({success: false, message: "Missing required fields"});

        }
           const feedback = new Feedback({
            customerName,
            rating,
            comment,
            category,
            customerId
           });
           await feedback.save();
           res.status(201).json({success: true, data: feedback});

      } catch(error) {
        res.status(500).json({success: false, message: error.message})
      }
};

      export const getFeedbacks = async (req,res) => {
        try {
             const feedbacks = await Feedback.find().sort({ createdAt :-1})
             res.status(200).json({success: true, data: feedbacks })

        } catch(error) {
            res.status(500).json({success: false, message: error.message})
        }
   
    };