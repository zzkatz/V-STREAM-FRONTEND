import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSubscribedChannels } from "../../store/Slices/subscriptionSlice";
import { Avatar } from "../../components";
import { Link } from "react-router-dom";

function ChannelSubscribers() {
    const dispatch = useDispatch();
    const channelId = useSelector((state) => state.user.profileData?._id);
    const subscriptions = useSelector(
        (state) => state.subscription.mySubscriptions
    );

    useEffect(() => {
        if (channelId) {
            dispatch(getSubscribedChannels(channelId));
        }
    }, [dispatch, channelId]);

    if (!subscriptions?.length) {
        return (
            <div className="text-white text-center py-6">
                No subscribed channels
            </div>
        );
    }

    return (
        <>
            {subscriptions.map((subscription) => {
                const channel = subscription?.subscribedChannel;
                if (!channel?._id) return null;

                return (
                    <Link
                        key={channel._id}
                        to={`/channel/${channel.username}/videos`}
                        className="flex border-b border-slate-500 px-3 py-2 items-center text-white gap-3 hover:bg-[#222222]"
                    >
                        <Avatar
                            src={channel?.avatar?.url}
                            channelName={channel?.username}
                        />
                        <div>
                            <h5 className="text-sm">
                                {channel?.fullName || channel?.username}
                            </h5>
                            <span className="text-xs text-slate-400">
                                {channel?.subscribersCount || 0} Subscribers
                            </span>
                        </div>
                    </Link>
                );
            })}
        </>
    );
}

export default ChannelSubscribers;
