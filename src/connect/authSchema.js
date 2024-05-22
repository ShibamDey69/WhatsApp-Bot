import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
            sessionId: {
                type: String,
                required: true,
                unique: true,
            },

            session: String,
        });

export default mongoose.model("sessionSchema", sessionSchema);