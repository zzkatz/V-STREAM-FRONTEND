import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSubscribedChannels } from "../store/Slices/subscriptionSlice";
import { Link } from "react-router-dom";
import { Avatar } from "../components";

function MySubscriptions() {
    const dispatch = useDispatch();
    const subscriptions = useSelector(
        (state) => state.subscription?.mySubscriptions
    );
    const subscriberId = useSelector((state) => state.auth?.userData?._id);

    useEffect(() => {
        if (subscriberId) {
            dispatch(getSubscribedChannels(subscriberId));
        }
    }, [dispatch, subscriberId]);

    window.scrollTo(0, 0);

    if (!subscriptions?.length) {
        return (
            <div className="text-white text-center py-10 mb-20 sm:mb-0">
                No subscribed channels yet
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 text-white mb-20 sm:mb-0">
            {subscriptions.map((subscription) => {
                const channel = subscription?.subscribedChannel;
                if (!channel?._id) return null;

                return (
                    <Link
                        to={`/channel/${channel.username}/videos`}
                        key={channel._id}
                        className="flex items-center gap-3 border border-slate-600 p-3 hover:bg-[#222222]"
                    >
                        <Avatar
                            src={channel?.avatar?.url}
                            channelName={channel?.username}
                        />
                        <div className="min-w-0">
                            <h5 className="font-semibold truncate">
                                {channel?.fullName || channel?.username}
                            </h5>
                            <p className="text-sm text-slate-400 truncate">
                                @{channel?.username}
                            </p>
                            <span className="text-xs text-slate-400">
                                {channel?.subscribersCount || 0} Subscribers
                            </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

export default MySubscriptions;
