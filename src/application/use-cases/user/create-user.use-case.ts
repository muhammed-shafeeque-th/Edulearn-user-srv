import { Injectable } from "@nestjs/common";
import User, { UserStatus } from "src/domain/entities/user.entity";
import { Cart } from "src/domain/entities/cart.entity";
import { Wishlist } from "src/domain/entities/wishlist.entity";
import { UserAlreadyExistException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import CreateUserDto from "src/presentation/grpc/dtos/create-user.dto";
import { Wallet } from "src/domain/entities/user-wallet.entity";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { UserCreatedEvent } from "src/domain/events/user-created.event";

@Injectable()
export default class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cartRepository: ICartRepository,
    private readonly wishlistRepository: IWishlistRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService
  ) { }

  public async execute(dto: UserCreatedEvent): Promise<User> {
    return this.tracer.startActiveSpan(
      "CreateUserUseCase.execute",
      async (span) => {
        const { payload } = dto;

        span.setAttribute("user.email", payload.email);

        // Check if the user already exists with the provided email
        const alreadyExist = await this.userRepository.findByEmail(payload.email);
        if (alreadyExist) {
          this.logger.debug(`User already exists with the email: ${payload.email}`);
          span.setAttribute("email.exist", true);
          throw new UserAlreadyExistException(
            `User already exists with ${payload.email}`
          );
        }
        this.logger.debug(`No existing user found with email: ${payload.email}`);
        span.setAttribute("email.exist", false);

        // Create user entity
        const user = User.create({
          id: payload.userId,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          avatar: payload.avatar,
          status: UserStatus.VERIFIED,
          role: payload.role,
          createdAt: payload.createdAt,
        });

        this.logger.debug("Saving user data to repository for registration", {
          email: payload.email,
        });

        // await Promise.all([
          await this.userRepository.save(user),
          await this.createInitialUserAssets(user.id),
        // ]);

        this.logger.debug("Completed user creation", {
          email: payload.email,
          ctx: CreateUserUseCase.name,
        });

        return user;
      }
    );
  }

  // Helper to encapsulate setup of initial user assets (cart, wishlist, wallet)
  private async createInitialUserAssets(userId: string): Promise<void> {
    return this.tracer.startActiveSpan(
      "CreateUserUseCase.createInitialUserAssets",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
        });

        try {
          const cart = Cart.create({
            userId,
            items: [],
          });
          const wishlist = Wishlist.create({
            userId,
            items: [],
          });
          const wallet = Wallet.createInitial(userId, "INR");

          await Promise.all([
            this.cartRepository.create(cart),
            this.wishlistRepository.create(wishlist),
            this.walletRepository.save(wallet),
          ]);

          this.logger.debug(
            `Created cart, wishlist, and wallet for user ${userId}`,
            {
              userId,
              cartId: cart.id,
              wishlistId: wishlist.id,
              ctx: CreateUserUseCase.name,
            }
          );

          span.setAttributes({
            "cart.id": cart.id,
            "wishlist.id": wishlist.id,
            "wallet.id": wallet.id,
            "cart.created": true,
            "wishlist.created": true,
            "wallet.created": true,
          });
        } catch (error) {
          this.logger.error(
            `Failed to create cart, wallet, or wishlist for user ${userId}`,
            {
              userId,
              error,
              ctx: CreateUserUseCase.name,
            }
          );
          span.setAttributes({
            "cart.created": false,
            "wishlist.created": false,
            "wallet.created": false,
          });
          throw error;
        }
      }
    );
  }
}
